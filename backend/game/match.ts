import type { Duplex } from 'node:stream';
import type { IncomingMessage } from 'node:http';
import type { Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { Simulation, RULES, type Input } from '../../shared/game/simulation';
import { NEUTRAL, validCommand, type Command, type ServerState } from '../../shared/game/protocol';

export interface MatchOptions {
    noServer?: boolean;
    resolveMember?: (request: IncomingMessage) => { id: string; seat: number | null } | undefined;
    canPlay?: () => boolean;
    mayReset?: (id: string) => boolean;
    onGoal?: (team: string) => void;
    onRosterChanged?: () => void;
}
interface Client {
    memberId?: string;
    socket: WebSocket;
    seat: number | null;
    queue: Command[];
    accepted: number;
    ack: number;
    input: Input;
    lastInput: number;
    alive: boolean;
    windowStart: number;
    received: number;
    lastReset: number;
}
export async function attachMatch(server: Server, options: MatchOptions = {}) {
    const game = await Simulation.create(RULES.maxPlayers);
    const wss = new WebSocketServer(
        options.noServer
            ? { noServer: true, maxPayload: 2048 }
            : { server, path: '/game', maxPayload: 2048 },
    );
    game.setConnectedSeats([]);
    const slots = Array.from({ length: RULES.maxPlayers }, (_, index) => index);
    const clients = new Set<Client>();
    const started = performance.now();
    let tick = 0,
        last = performance.now(),
        accumulator = 0;
    const metrics = {
        steps: 0,
        physicsMs: 0,
        maxPhysicsMs: 0,
        inboundBytes: 0,
        outboundBytes: 0,
        droppedSeconds: 0,
    };
    const ready = () =>
        options.canPlay
            ? options.canPlay() && [...clients].some((c) => c.seat !== null)
            : [0, 1].every((team) =>
                  [...clients].some((c) => c.seat !== null && c.seat % 2 === team),
              );
    const syncRoster = () =>
        game.setConnectedSeats([...clients].flatMap((c) => (c.seat !== null ? [c.seat] : [])));
    const hostSeat = () =>
        Math.min(...[...clients].flatMap((c) => (c.seat !== null ? [c.seat] : [])));
    const send = (c: Client, data: string) => {
        if (c.socket.readyState !== WebSocket.OPEN) return;
        if (c.socket.bufferedAmount > 65536) {
            c.socket.close(1013, 'Slow connection');
            return;
        }
        metrics.outboundBytes += Buffer.byteLength(data);
        c.socket.send(data);
    };
    const state = (): ServerState => {
        const seats = slots.map((seat) => [...clients].find((c) => c.seat === seat));
        return {
            type: 'state',
            tick,
            time: performance.now(),
            ready: ready(),
            ack: seats.map((c) => c?.ack ?? 0),
            inputs: seats.map((c) => c?.input ?? NEUTRAL),
            game: game.snapshot(),
            hostSeat: options.resolveMember
                ? ([...clients].find((c) => c.memberId && options.mayReset?.(c.memberId))?.seat ??
                  -1)
                : hostSeat(),
        };
    };
    const broadcast = () => {
        const data = JSON.stringify(state());
        for (const c of clients) send(c, data);
    };
    let disposed = false;
    const reset = (match: boolean) => {
        if (disposed) return;
        if (match) game.resetMatch();
        else game.resetRound();
        for (const c of clients) {
            c.queue = [];
            c.ack = c.accepted;
            c.input = NEUTRAL;
        }
        broadcast();
    };
    wss.on('connection', (socket, request) => {
        const member = options.resolveMember?.(request);
        if (options.resolveMember && !member) {
            socket.close(1008, 'Room membership required');
            return;
        }
        if (member)
            for (const existing of clients)
                if (existing.memberId === member.id) {
                    clients.delete(existing);
                    existing.socket.terminate();
                }
        const seat = member
            ? member.seat
            : (slots.find((seat) => ![...clients].some((c) => c.seat === seat)) ?? null);
        const c: Client = {
            socket,
            memberId: member?.id,
            seat,
            queue: [],
            accepted: 0,
            ack: 0,
            input: NEUTRAL,
            lastInput: 0,
            alive: true,
            windowStart: performance.now(),
            received: 0,
            lastReset: -Infinity,
        };
        clients.add(c);
        send(c, JSON.stringify({ type: 'welcome', seat }));
        if (seat !== null) {
            syncRoster();
            if (options.resolveMember) {
                game.spawnSeat(seat);
                broadcast();
            } else reset(false);
        } else send(c, JSON.stringify(state()));
        options.onRosterChanged?.();
        socket.on('pong', () => {
            c.alive = true;
        });
        socket.on('error', () => socket.terminate());
        socket.on('message', (raw, binary) => {
            metrics.inboundBytes += Buffer.byteLength(raw.toString());
            if (binary) return;
            let message;
            try {
                message = JSON.parse(raw.toString());
            } catch {
                return;
            }
            if (!message || typeof message !== 'object') return;
            const now = performance.now();
            if (message.type === 'ping' && Number.isFinite(message.sent)) {
                send(c, JSON.stringify({ type: 'pong', sent: message.sent }));
                return;
            }
            if (c.seat === null) return;
            if (message.type === 'release') {
                c.queue = [];
                c.ack = c.accepted;
                c.input = NEUTRAL;
                return;
            }
            if (
                message.type === 'reset' &&
                typeof message.match === 'boolean' &&
                (c.memberId ? options.mayReset?.(c.memberId) : c.seat === hostSeat()) &&
                now - c.lastReset > 500
            ) {
                c.lastReset = now;
                reset(message.match);
                return;
            }
            if (
                message.type !== 'input' ||
                message.epoch !== game.snapshot().epoch ||
                !Array.isArray(message.commands) ||
                message.commands.length > 8
            )
                return;
            if (now - c.windowStart >= 1000) {
                c.windowStart = now;
                c.received = 0;
            }
            c.received += message.commands.length;
            if (c.received > 120 || !message.commands.every(validCommand)) return;
            for (const command of message.commands as Command[]) {
                if (command.seq <= c.accepted || command.seq > c.accepted + 120) continue;
                c.accepted = command.seq;
                c.lastInput = now;
                if (!ready()) {
                    c.ack = command.seq;
                    c.input = NEUTRAL;
                    continue;
                }
                if (c.queue.length >= 30) {
                    socket.close(1008, 'Input backlog');
                    return;
                }
                c.queue.push(command);
            }
        });
        socket.on('close', () => {
            clients.delete(c);
            if (c.seat !== null && !disposed) {
                syncRoster();
                if (options.resolveMember) broadcast();
                else reset(false);
                options.onRosterChanged?.();
            }
        });
    });
    const timer = setInterval(() => {
        const now = performance.now(),
            elapsed = (now - last) / 1000;
        last = now;
        metrics.droppedSeconds += Math.max(0, elapsed - 0.1);
        accumulator += Math.min(elapsed, 0.1);
        while (accumulator >= RULES.timestep) {
            tick++;
            let urgent = false;
            if (ready()) {
                const inputs = slots.map((seat) => {
                    const c = [...clients].find((c) => c.seat === seat);
                    if (!c) return NEUTRAL;
                    const previous = c.input;
                    const command = c.queue.shift();
                    if (command) {
                        c.input = command;
                        c.ack = command.seq;
                    } else if (now - c.lastInput > 250) c.input = NEUTRAL;
                    if (
                        previous.x !== c.input.x ||
                        previous.y !== c.input.y ||
                        previous.shoot !== c.input.shoot
                    )
                        urgent = true;
                    return c.input;
                });
                const before = game.snapshot();
                const start = performance.now();
                game.step(inputs);
                const cost = performance.now() - start;
                metrics.steps++;
                metrics.physicsMs += cost;
                metrics.maxPhysicsMs = Math.max(metrics.maxPhysicsMs, cost);
                const after = game.snapshot();
                if (after.phase === 'goal' && before.phase !== 'goal')
                    options.onGoal?.(after.lastScorer === 'left' ? 'Niebiescy' : 'Pomarańczowi');
                if (after.kickSerial !== before.kickSerial || after.phase !== before.phase)
                    urgent = true;
                if (after.epoch !== before.epoch)
                    for (const c of clients) {
                        c.queue = [];
                        c.ack = c.accepted;
                        c.input = NEUTRAL;
                    }
            }
            accumulator -= RULES.timestep;
            if (tick % 3 === 0 || urgent) broadcast();
        }
    }, 8);
    const heartbeat = setInterval(() => {
        for (const c of clients) {
            if (!c.alive) {
                c.socket.terminate();
                continue;
            }
            c.alive = false;
            c.socket.ping();
        }
    }, 5000);
    return {
        canStart: () =>
            [0, 1].every((team) =>
                [...clients].some((c) => c.seat !== null && c.seat % 2 === team),
            ),
        upgrade(request: IncomingMessage, socket: Duplex, head: Buffer) {
            wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request));
        },
        restart() {
            reset(true);
        },
        stop() {
            reset(false);
        },
        disconnectMember(id: string) {
            for (const c of clients)
                if (c.memberId === id) {
                    clients.delete(c);
                    c.socket.close(4001, 'Membership changed');
                }
            syncRoster();
            broadcast();
            options.onRosterChanged?.();
        },
        metrics: () => ({
            ...metrics,
            elapsedSeconds: (performance.now() - started) / 1000,
            outboundBytesPerSecond: metrics.outboundBytes / ((performance.now() - started) / 1000),
            averagePhysicsMs: metrics.steps ? metrics.physicsMs / metrics.steps : 0,
            players: [...clients].filter((c) => c.seat !== null).length,
            spectators: [...clients].filter((c) => c.seat === null).length,
            tick,
        }),
        dispose() {
            if (disposed) return;
            disposed = true;
            clearInterval(timer);
            clearInterval(heartbeat);
            for (const c of clients) c.socket.terminate();
            clients.clear();
            wss.close();
            game.dispose();
        },
    };
}
