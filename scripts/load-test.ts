import { fork, type ChildProcess } from 'node:child_process';
import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { WebSocket } from 'ws';
import type { LobbyMessage, LobbyRequest, RoomState } from '../shared/game/lobbyProtocol';
import type { ServerMessage, ServerState } from '../shared/game/protocol';
import { LEGENDARY_AVATARS } from '../shared/game/avatars';
import { arenaEnergyPads, validArena } from '../shared/game/arenas';
import { Samples, summarizeServer, type ServerMetrics } from './load-report';

async function until(check: () => boolean, timeout = 10000) {
    const end = performance.now() + timeout;
    while (!check()) {
        if (performance.now() > end) throw new Error('Connection/state timeout');
        await wait(10);
    }
}
interface Bot {
    index: number;
    roomId: string;
    id: string;
    token: string;
    room: RoomState | null;
    state?: ServerState;
    lobby?: WebSocket;
    game?: WebSocket;
    seat?: number | null;
    seq: number;
    lastSnapshot: number;
    online: boolean;
}
async function main() {
    const { values } = parseArgs({
        options: {
            rooms: { type: 'string', default: '3' },
            players: { type: 'string', default: '10' },
            duration: { type: 'string', default: '30' },
            latency: { type: 'string', default: '0' },
            jitter: { type: 'string', default: '0' },
            churn: { type: 'boolean', default: false },
            arena: { type: 'string', default: 'classic' },
            skin: { type: 'string', default: 'grass' },
            url: { type: 'string' },
            output: { type: 'string' },
            help: { type: 'boolean', short: 'h' },
        },
    });
    if (values.help) {
        console.log(
            'npm run load-test -- --rooms 3 --players 10 --duration 30 [--arena large-rounded --skin night] [--latency 100 --jitter 30 --churn] [--url https://your-server] [--output dist/reports/load.json]\nLatency and jitter are simulated ONE WAY, preserving WebSocket order. Without --url a separate temporary localhost server is started.',
        );
        return;
    }
    const number = (
        key: 'rooms' | 'players' | 'duration' | 'latency' | 'jitter',
        min: number,
        max: number,
    ) => {
        const value = Number(values[key]);
        if (!Number.isInteger(value) || value < min || value > max)
            throw new Error(`${key}: expected integer ${min}–${max}`);
        return value;
    };
    const rooms = number('rooms', 1, 20),
        players = number('players', 2, 10),
        duration = number('duration', 5, 3600),
        latency = number('latency', 0, 500),
        jitter = number('jitter', 0, 250);
    const arena = { id: values.arena, skin: values.skin };
    if (!validArena(arena)) throw new Error('Invalid --arena or --skin');
    let child: ChildProcess | undefined;
    let base = values.url;
    if (!base) {
        child = fork(path.join(__dirname, 'load-server.cjs'), [], {
            stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
        });
        base = await new Promise<string>((resolve, reject) => {
            const timer = setTimeout(
                () => reject(new Error('Temporary server startup timeout')),
                10000,
            );
            child!.once('message', (message: { port: number }) => {
                clearTimeout(timer);
                resolve(`http://127.0.0.1:${message.port}`);
            });
            child!.once('exit', (code) => {
                clearTimeout(timer);
                reject(new Error(`Temporary server exited: ${code}`));
            });
        });
    }
    const httpBase = new URL(base);
    if (!['http:', 'https:'].includes(httpBase.protocol))
        throw new Error('URL must use http or https');
    const wsBase = new URL(httpBase);
    wsBase.protocol = httpBase.protocol === 'https:' ? 'wss:' : 'ws:';
    const websocketUrl = (route: string) => new URL(route, wsBase).href;
    const metrics = async () => {
        const response = await fetch(new URL('/metrics', httpBase), {
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error(`/metrics returned ${response.status}`);
        const result = (await response.json()) as ServerMetrics;
        if (result.schemaVersion !== 2 || !result.runtime)
            throw new Error('Update server build: runtime metrics schema 2 required');
        return result;
    };
    const bots: Bot[] = [];
    const roomIds: string[] = [];
    const expectedClose = new Set<WebSocket>();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const intervals: ReturnType<typeof setInterval>[] = [];
    const tasks = new Set<Promise<void>>();
    const cadence = new Samples(),
        rtt = new Samples();
    const errors: string[] = [];
    let measuring = false,
        started = 0,
        snapshotCount = 0,
        pickups = 0,
        boostSnapshots = 0,
        reconnects = 0,
        unexpectedDisconnects = 0,
        invalidStates = 0;
    let randomState = 0x12345678;
    const random = () => {
        randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
        return randomState / 4294967296;
    };
    const delivery = () => Math.max(0, latency + (random() * 2 - 1) * jitter);
    const delayed = (callback: () => void, delay: number) => {
        const timer = setTimeout(
            () => {
                timers.delete(timer);
                callback();
            },
            Math.max(0, delay),
        );
        timers.add(timer);
    };
    const attach = (socket: WebSocket, receive: (raw: string) => void) => {
        let inboundDue = 0,
            outboundDue = 0;
        socket.on('error', (error) => {
            if (!expectedClose.has(socket)) errors.push(error.message);
        });
        socket.on('close', () => {
            if (!expectedClose.has(socket)) {
                unexpectedDisconnects++;
                errors.push('Unexpected WebSocket disconnect');
            }
        });
        socket.on('message', (raw) => {
            inboundDue = Math.max(inboundDue, performance.now() + delivery());
            delayed(() => receive(raw.toString()), inboundDue - performance.now());
        });
        return (data: unknown) => {
            const payload = JSON.stringify(data);
            outboundDue = Math.max(outboundDue, performance.now() + delivery());
            delayed(() => {
                if (socket.readyState === WebSocket.OPEN) socket.send(payload);
            }, outboundDue - performance.now());
        };
    };
    const lobbySend = new Map<Bot, (request: LobbyRequest) => void>(),
        gameSend = new Map<Bot, (request: unknown) => void>();
    const openLobby = async (bot: Bot, resume = false) => {
        bot.id = '';
        bot.room = null;
        const socket = (bot.lobby = new WebSocket(
            websocketUrl(`/lobby${resume ? `?resume=${bot.token}` : ''}`),
        ));
        const send = attach(socket, (raw) => {
            const message = JSON.parse(raw) as LobbyMessage;
            if (message.type === 'identity') {
                bot.id = message.id;
                bot.token = message.resumeToken;
            }
            if (message.type === 'room') bot.room = message.room;
            if (message.type === 'error') errors.push(message.message);
        });
        lobbySend.set(bot, send);
        await until(() => socket.readyState === WebSocket.OPEN && !!bot.id);
        send({
            type: 'hello',
            nick: `Load ${bot.index}`,
            avatar: LEGENDARY_AVATARS[bot.index % LEGENDARY_AVATARS.length],
        });
    };
    const openGame = async (bot: Bot) => {
        bot.seq = 0;
        bot.seat = undefined;
        bot.state = undefined;
        bot.lastSnapshot = 0;
        const socket = (bot.game = new WebSocket(
            websocketUrl(`/game?room=${bot.roomId}&member=${bot.token}`),
        ));
        const send = attach(socket, (raw) => {
            const message = JSON.parse(raw) as ServerMessage;
            if (message.type === 'welcome') bot.seat = message.seat;
            if (message.type === 'pong' && measuring) rtt.add(performance.now() - message.sent);
            if (message.type === 'state') {
                if (measuring) {
                    const now = performance.now();
                    if (bot.lastSnapshot) cadence.add(now - bot.lastSnapshot);
                    bot.lastSnapshot = now;
                    snapshotCount++;
                    if (
                        bot.state &&
                        bot.seat !== null &&
                        bot.seat !== undefined &&
                        message.game.energy[bot.seat] > bot.state.game.energy[bot.seat] + 1
                    )
                        pickups++;
                    if (message.game.boosting.some(Boolean)) boostSnapshots++;
                    if (
                        message.game.players.some(
                            (p) => !Number.isFinite(p.x) || !Number.isFinite(p.y),
                        ) ||
                        message.game.energy.some((e) => !Number.isFinite(e) || e < 0 || e > 100)
                    )
                        invalidStates++;
                }
                bot.state = message;
            }
        });
        gameSend.set(bot, send);
        await until(() => bot.seat !== undefined && !!bot.state);
        if (bot.seat === null) throw new Error('Load-test client assigned spectator slot');
        bot.online = true;
    };
    let cleaned = false;
    const cleanup = async () => {
        if (cleaned) return;
        cleaned = true;
        measuring = false;
        for (const interval of intervals) clearInterval(interval);
        await Promise.allSettled([...tasks]);
        for (const bot of bots) {
            bot.online = false;
            if (bot.game) expectedClose.add(bot.game);
            if (bot.lobby?.readyState === WebSocket.OPEN) lobbySend.get(bot)?.({ type: 'leave' });
        }
        await Promise.allSettled(bots.map((bot) => until(() => !bot.room, 3000)));
        try {
            const remaining = await metrics();
            if (remaining.rooms.some((room) => roomIds.includes(room.id)))
                errors.push('Load-test rooms remained after cleanup');
        } catch (error) {
            errors.push(`Cleanup verification: ${String(error)}`);
        }
        for (const timer of timers) clearTimeout(timer);
        for (const bot of bots)
            for (const socket of [bot.lobby, bot.game])
                if (socket) {
                    expectedClose.add(socket);
                    socket.terminate();
                }
        if (child) {
            if (child.connected) child.send('stop');
            await until(() => child!.exitCode !== null, 5000).catch(() => child!.kill());
        }
    };
    try {
        await metrics();
        for (let roomIndex = 0; roomIndex < rooms; roomIndex++) {
            for (let index = 0; index < players; index++) {
                const bot: Bot = {
                    index: roomIndex * players + index,
                    roomId: '',
                    id: '',
                    token: '',
                    room: null,
                    seq: 0,
                    lastSnapshot: 0,
                    online: false,
                };
                bots.push(bot);
                await openLobby(bot);
                if (index === 0) {
                    lobbySend.get(bot)!({
                        type: 'create',
                        name: `Load ${process.pid}-${roomIndex}`,
                    });
                    await until(() => !!bot.room);
                    roomIds.push(bot.room!.id);
                } else lobbySend.get(bot)!({ type: 'join', roomId: roomIds[roomIndex] });
                await until(() => !!bot.room);
                bot.roomId = bot.room!.id;
                await openGame(bot);
            }
            const host = bots[roomIndex * players];
            await until(() => !!host.room?.ready);
            lobbySend.get(host)!({ type: 'arena', arena });
            lobbySend.get(host)!({
                type: 'settings',
                name: `Load ${process.pid}-${roomIndex}`,
                settings: { durationSeconds: 3600, goalLimit: 0 },
            });
            lobbySend.get(host)!({ type: 'start' });
            await until(() => host.state?.ready === true);
        }
        const workloadStart = performance.now();
        intervals.push(
            setInterval(() => {
                const elapsed = (performance.now() - workloadStart) / 1000;
                for (const bot of bots) {
                    if (
                        !bot.online ||
                        !bot.state?.ready ||
                        bot.seat === null ||
                        bot.seat === undefined
                    )
                        continue;
                    const actor = bot.state.game.players[bot.seat];
                    const energy = bot.state.game.energy[bot.seat] ?? 0;
                    const pads = arenaEnergyPads(bot.state.game.arena);
                    const pad = pads[(bot.index + Math.floor(elapsed / 8)) % pads.length];
                    const target = energy < 25 ? pad : bot.state.game.ball;
                    const axis = (distance: number) =>
                        Math.abs(distance) < 0.25 ? 0 : Math.sign(distance);
                    const input = {
                        x: axis(target.x - actor.x),
                        y: axis(target.y - actor.y),
                        shoot: Math.floor(elapsed * 4 + bot.index) % 2 === 0,
                        boost: energy > 0 && (elapsed + bot.index) % 5 < 2,
                    };
                    gameSend.get(bot)!({
                        type: 'input',
                        epoch: bot.state.game.epoch,
                        commands: [1, 2].map(() => ({ ...input, seq: ++bot.seq })),
                    });
                }
            }, 1000 / 30),
        );
        intervals.push(
            setInterval(() => {
                for (const bot of bots)
                    if (bot.online) gameSend.get(bot)?.({ type: 'ping', sent: performance.now() });
            }, 1000),
        );
        intervals.push(
            setInterval(() => {
                for (let i = 0; i < rooms; i++) {
                    const host = bots[i * players];
                    lobbySend.get(host)?.({
                        type: 'chat',
                        text: 'Load test: chat during live match',
                    });
                }
            }, 5000),
        );
        if (values.churn)
            intervals.push(
                setInterval(() => {
                    const bot = bots[(reconnects % rooms) * players + players - 1];
                    if (!bot.online) return;
                    const task = (async () => {
                        bot.online = false;
                        const id = bot.id;
                        for (const socket of [bot.lobby, bot.game])
                            if (socket) {
                                expectedClose.add(socket);
                                socket.terminate();
                            }
                        await wait(250);
                        await openLobby(bot, true);
                        await until(() => !!bot.room);
                        if (bot.id !== id)
                            throw new Error('Reconnect did not preserve room membership');
                        await openGame(bot);
                        reconnects++;
                    })()
                        .catch((error) => {
                            errors.push(String(error));
                        })
                        .finally(() => tasks.delete(task));
                    tasks.add(task);
                }, 5000),
            );
        await wait(2000);
        const before = await metrics();
        measuring = true;
        started = performance.now();
        for (const bot of bots) bot.lastSnapshot = 0;
        console.log(
            JSON.stringify({
                phase: 'running',
                rooms,
                players: rooms * players,
                durationSeconds: duration,
                arena,
                oneWayLatencyMs: latency,
                jitterMs: jitter,
                churn: values.churn,
            }),
        );
        intervals.push(
            setInterval(
                () =>
                    console.log(
                        JSON.stringify({
                            progressSeconds: Math.round((performance.now() - started) / 1000),
                            snapshots: snapshotCount,
                            reconnects,
                            unexpectedDisconnects,
                        }),
                    ),
                10000,
            ),
        );
        await wait(duration * 1000);
        const after = await metrics(),
            elapsed = (performance.now() - started) / 1000;
        measuring = false;
        const server = summarizeServer(before, after, roomIds, elapsed);
        const failures = [...new Set(errors)];
        if (invalidStates) failures.push(`Invalid physics/energy snapshots: ${invalidStates}`);
        if (server.rooms.some((room) => room.stepsPerSecond < 57))
            failures.push('At least one room ran below 57 simulation steps/sec');
        if (server.rooms.some((room) => room.droppedSeconds > 0.1))
            failures.push('Server dropped more than 100 ms of simulation time');
        if (server.eventLoopDelaySinceServerStart.p99Ms > 100)
            failures.push('Server event-loop p99 exceeded 100 ms');
        if (!snapshotCount || rtt.count === 0) failures.push('Missing snapshots or ping replies');
        const report = {
            timestamp: new Date().toISOString(),
            target: values.url ?? 'temporary isolated localhost server',
            config: {
                rooms,
                playersPerRoom: players,
                durationSeconds: duration,
                arena,
                oneWayLatencyMs: latency,
                jitterMs: jitter,
                churn: values.churn,
            },
            server,
            clients: {
                snapshots: snapshotCount,
                snapshotDeliveryIntervals: cadence.snapshot(),
                pingRtt: rtt.snapshot(),
                pickupsObserved: pickups,
                boostSnapshots,
                reconnects,
                unexpectedDisconnects,
                invalidStates,
            },
            passed: failures.length === 0,
            failures,
            limits: 'Load generators use Node.js, not Pixi rendering. Server and bots run in separate processes on the same host for local tests. Delays preserve message order; packet loss is not simulated. Memory growth is not proof of a leak. Event-loop histogram covers server uptime; physics average/max covers room lifetime.',
        };
        await cleanup();
        for (const error of errors)
            if (!report.failures.includes(error)) report.failures.push(error);
        report.passed = report.failures.length === 0;
        if (values.output) {
            await mkdir(path.dirname(values.output), { recursive: true });
            await writeFile(values.output, JSON.stringify(report, null, 2) + '\n');
        }
        console.log(JSON.stringify(report, null, 2));
        if (!report.passed) process.exitCode = 1;
    } finally {
        await cleanup();
    }
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
