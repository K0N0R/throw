import test from 'node:test';
import assert from 'node:assert/strict';
import { Samples, summarizeServer, type ServerMetrics } from '../scripts/load-report';
import { createGameServer } from '../backend/server';
import { once } from 'node:events';

test('latency summaries reject invalid samples and preserve maxima with bounded storage', () => {
    const samples = new Samples();
    samples.add(NaN);
    samples.add(-1);
    assert.equal(samples.snapshot().samples, 0);
    for (let i = 1; i <= 100; i++) samples.add(i);
    assert.equal(samples.snapshot().meanMs, 50.5);
    assert.equal(samples.snapshot().p95Ms, 95);
    assert.equal(samples.snapshot().p99Ms, 99);
    for (let i = 101; i <= 20000; i++) samples.add(i);
    assert.equal(samples.snapshot().maxMs, 20000);
    assert.equal(samples.snapshot().samples, 20000);
});
test('report uses measured counter differences and only selected rooms', () => {
    const initial: ServerMetrics = {
        schemaVersion: 2,
        runtime: {
            uptimeSeconds: 0,
            cpuMilliseconds: 100,
            rssBytes: 10 * 1048576,
            heapUsedBytes: 3 * 1048576,
            eventLoopDelay: { meanMs: 20, p95Ms: 30, p99Ms: 40, maxMs: 50 },
        },
        rooms: [
            {
                id: 'load',
                match: {
                    steps: 60,
                    droppedSeconds: 0,
                    inboundBytes: 100,
                    outboundBytes: 1000,
                    averagePhysicsMs: 0.1,
                    maxPhysicsMs: 0.5,
                    players: 10,
                },
            },
        ],
    };
    const final: ServerMetrics = {
        ...initial,
        runtime: { ...initial.runtime, cpuMilliseconds: 300, rssBytes: 12 * 1048576 },
        rooms: [
            {
                id: 'load',
                match: {
                    ...initial.rooms[0].match,
                    steps: 660,
                    inboundBytes: 1100,
                    outboundBytes: 11000,
                },
            },
            { id: 'other', match: { ...initial.rooms[0].match, steps: 99999 } },
        ],
    };
    const report = summarizeServer(initial, final, ['load'], 10);
    assert.equal(report.cpuPercentOfOneCore, 2);
    assert.equal(report.rssGrowthMiB, 2);
    assert.equal(report.rooms.length, 1);
    assert.equal(report.rooms[0].stepsPerSecond, 60);
    assert.equal(report.rooms[0].outboundBytesPerSecond, 1000);
    assert.throws(() => summarizeServer(initial, final, ['missing'], 10), /Missing/);
});
test('metrics endpoint exposes finite runtime data without removing existing game metrics', async () => {
    const { server, match, lobby } = await createGameServer();
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
        const response = await fetch(
            `http://127.0.0.1:${(server.address() as { port: number }).port}/metrics`,
        );
        const metrics = (await response.json()) as ServerMetrics & {
            players: number;
            tick: number;
        };
        assert.equal(metrics.schemaVersion, 2);
        assert.ok(metrics.runtime.rssBytes > 0);
        assert.ok(metrics.runtime.heapUsedBytes > 0);
        assert.ok(Number.isFinite(metrics.runtime.cpuMilliseconds));
        assert.ok(Number.isFinite(metrics.runtime.eventLoopDelay.meanMs));
        assert.equal(metrics.players, 0);
        assert.ok(metrics.tick >= 0);
        assert.deepEqual(metrics.rooms, []);
    } finally {
        lobby.dispose();
        match.dispose();
        await new Promise<void>((resolve) => server.close(() => resolve()));
    }
});

test('bounded percentile samples cover the whole run instead of only its final window', () => {
    const samples = new Samples();
    for (let i = 0; i < 10000; i++) samples.add(1000);
    for (let i = 0; i < 10000; i++) samples.add(1);
    assert.equal(samples.snapshot().meanMs, 500.5);
    assert.equal(samples.snapshot().p95Ms, 1000);
});
