import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { setTimeout as wait } from 'node:timers/promises';
import { WebSocket } from 'ws';
import { createGameServer } from '../backend/server';
import { Simulation, RULES } from '../shared/game/simulation';
import { validCommand, type ServerState } from '../shared/game/protocol';

async function until(check: () => boolean, timeout = 4000) {
    const end = Date.now() + timeout;
    while (!check()) {
        assert.ok(Date.now() < end, 'Timed out');
        await wait(10);
    }
}
test('server owns movement, goals, reset, slots and reconnect; rejects stale or forged inputs', async () => {
    const { server, match } = await createGameServer();
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address() as { port: number };
    const peers: {
        socket: WebSocket;
        seat?: number | null;
        state?: ServerState;
        states: number;
        seq: number;
    }[] = [];
    const connect = async () => {
        const peer = {
            socket: new WebSocket(`ws://127.0.0.1:${address.port}/game`),
            states: 0,
            seq: 0,
        } as (typeof peers)[number];
        peer.socket.on('message', (data) => {
            const m = JSON.parse(data.toString());
            if (m.type === 'welcome') peer.seat = m.seat;
            if (m.type === 'state') {
                peer.state = m;
                peer.states++;
            }
        });
        peers.push(peer);
        await until(() => peer.seat !== undefined && !!peer.state);
        return peer;
    };
    const input = (peer: (typeof peers)[number], x: number, y: number, shoot = false) =>
        peer.socket.send(
            JSON.stringify({
                type: 'input',
                epoch: peer.state!.game.epoch,
                commands: [1, 2].map(() => ({ seq: ++peer.seq, x, y, shoot })),
            }),
        );
    try {
        const a = await connect();
        assert.equal(a.seat, 0);
        assert.equal(a.state!.ready, false);
        assert.deepEqual(
            a.state!.game.players.map((p) => p.active),
            Array.from({ length: RULES.maxPlayers }, (_, index) => index === 0),
        );
        const b = await connect();
        assert.equal(b.seat, 1);
        await until(() => a.state!.ready && b.state!.ready);
        const initialEpoch = a.state!.game.epoch;
        a.socket.send('{bad json');
        a.socket.send(
            JSON.stringify({
                type: 'input',
                epoch: initialEpoch,
                commands: [{ seq: 1, x: 999, y: 0, shoot: false }],
            }),
        );
        b.socket.send(JSON.stringify({ type: 'reset', match: true }));
        a.socket.send(JSON.stringify({ type: 'score', score: [999, 0] }));
        await wait(100);
        assert.equal(a.state!.game.epoch, initialEpoch);
        assert.deepEqual(a.state!.game.score, [0, 0]);
        for (let i = 0; i < 25; i++) {
            input(b, 0, -1);
            await wait(34);
        }
        assert.ok(b.state!.game.players[1].y < 4);
        // Leave the opponent away from the shot path and score using only valid controls.
        for (let i = 0; i < 70 && a.state!.game.score[0] === 0; i++) {
            input(a, 1, 0, true);
            await wait(34);
        }
        await until(() => a.state!.game.score[0] === 1);
        await until(() => b.state!.game.score[0] === 1);
        assert.equal(a.state!.game.phase, 'goal');
        await until(() => a.state!.game.phase === 'playing');
        assert.equal(a.state!.game.ball.x, 12);
        const epoch = a.state!.game.epoch;
        a.socket.send(JSON.stringify({ type: 'reset', match: true }));
        await until(() => a.state!.game.epoch > epoch);
        assert.deepEqual(a.state!.game.score, [0, 0]);
        // Commands in flight before the reset must not affect the new round.
        a.socket.send(
            JSON.stringify({
                type: 'input',
                epoch,
                commands: [{ seq: ++a.seq, x: 1, y: 0, shoot: true }],
            }),
        );
        await wait(150);
        assert.equal(a.state!.game.players[0].x, 10);
        const beforeStates = a.states;
        await wait(300);
        assert.ok(
            a.states - beforeStates >= 4 && a.states - beforeStates <= 8,
            'Snapshots bounded to about 20 Hz',
        );
        const c = await connect(),
            d = await connect();
        assert.equal(c.seat, 2);
        assert.equal(d.seat, 3);
        const additional: (typeof peers)[number][] = [];
        for (let seat = 4; seat < RULES.maxPlayers; seat++) {
            const peer = await connect();
            assert.equal(peer.seat, seat);
            additional.push(peer);
        }
        const spectator = await connect();
        assert.equal(spectator.seat, null);
        await until(() => a.state!.game.players.every((p) => p.active));
        assert.equal(a.state!.game.players.length, RULES.maxPlayers);
        const rosterEpoch = a.state!.game.epoch;
        spectator.socket.send(JSON.stringify({ type: 'reset', match: true }));
        await wait(100);
        assert.equal(a.state!.game.epoch, rosterEpoch);
        const cy = c.state!.game.players[2].y,
            dy = d.state!.game.players[3].y;
        for (let i = 0; i < 8; i++) {
            input(c, 0, 1, true);
            input(d, 0, 1);
            await wait(34);
        }
        await until(() => c.state!.ack[2] > 0 && d.state!.ack[3] > 0);
        assert.ok(c.state!.game.players[2].y > cy);
        assert.ok(d.state!.game.players[3].y > dy);
        assert.equal(c.state!.game.players[2].shooting, true);
        for (let i = 0; i < 8; i++) {
            additional.forEach((peer) => input(peer, 1, 0, true));
            await wait(34);
        }
        await until(() => additional.every((peer) => peer.state!.ack[peer.seat!] > 0));
        for (const peer of additional) {
            const player = peer.state!.game.players[peer.seat!];
            const startX = peer.seat! % 2 === 0 ? 10 : 14;
            assert.ok(player.x > startX, 'Each extra socket controls its own player');
            assert.equal(player.shooting, true);
        }
        a.socket.close();
        await until(() => !b.state!.game.players[0].active);
        assert.equal(b.state!.ready, true, 'C keeps the blue team active after A disconnects');
        const replacement = await connect();
        assert.equal(replacement.seat, 0);
        await until(() => replacement.state!.ready);
        const stats = match.metrics();
        assert.ok(stats.steps > 60);
        assert.ok(stats.inboundBytes > 0);
        assert.ok(stats.outboundBytes > 0);
        assert.equal(stats.players, RULES.maxPlayers);
        assert.equal(stats.spectators, 1);
    } finally {
        match.dispose();
        for (const peer of peers) peer.socket.terminate();
        await new Promise<void>((resolve) => server.close(() => resolve()));
    }
});
test('two-player simulation restores state and replay preserves movement', async () => {
    const a = await Simulation.create(true),
        b = await Simulation.create(true);
    try {
        for (let i = 0; i < 12; i++)
            a.step([
                { x: 0, y: 1, shoot: false },
                { x: 0, y: -1, shoot: false },
            ]);
        b.restore(a.snapshot());
        for (let i = 0; i < 10; i++) {
            const inputs = [
                { x: 0, y: 1, shoot: false },
                { x: 0, y: -1, shoot: false },
            ];
            a.step(inputs);
            b.step(inputs, false);
        }
        assert.ok(Math.abs(a.snapshot().players[0].y - b.snapshot().players[0].y) < 0.001);
        assert.ok(Math.abs(a.snapshot().players[1].y - b.snapshot().players[1].y) < 0.001);
    } finally {
        a.dispose();
        b.dispose();
    }
});
test('protocol rejects invalid input numbers and sequence IDs', () => {
    assert.equal(validCommand({ seq: 1, x: 1, y: 0, shoot: true }), true);
    for (const x of [Infinity, NaN, 2, '1'])
        assert.equal(validCommand({ seq: 1, x, y: 0, shoot: true }), false);
    assert.equal(validCommand({ seq: -1, x: 0, y: 0, shoot: false }), false);
});
