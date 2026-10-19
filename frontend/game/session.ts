import type { MatchProgress } from '../../shared/game/matchRules';
import { Simulation, RULES, type GameSnapshot, type Input } from '../../shared/game/simulation';
import { WorldPrediction } from '../../shared/game/prediction';
import {
    type ClientMessage,
    type Command,
    type ServerMessage,
    type ServerState,
} from '../../shared/game/protocol';

export interface GameSession {
    readonly label: string;
    readonly status: string | null;
    readonly debug: string;
    readonly multiplayer: boolean;
    readonly seat: number | null;
    readonly canReset: boolean;
    readonly canResetMatch: boolean;
    readonly playing: boolean;
    step(input: Input): void;
    snapshot(): GameSnapshot;
    reset(match: boolean): void;
    release(): void;
    dispose(): void;
}
export class LocalSession implements GameSession {
    readonly label = 'TRENING LOKALNY';
    readonly status = null;
    readonly debug = '';
    readonly multiplayer = false;
    readonly seat = 0;
    readonly canReset = true;
    readonly canResetMatch = true;
    readonly playing = true;
    constructor(private readonly simulation: Simulation) {}
    step(input: Input) {
        this.simulation.step(input);
    }
    snapshot() {
        return this.simulation.snapshot();
    }
    reset(match: boolean) {
        if (match) this.simulation.resetMatch();
        else this.simulation.resetRound();
    }
    release() {}
    dispose() {
        this.simulation.dispose();
    }
}

export class OnlineSession implements GameSession {
    readonly multiplayer = true;
    seat: number | null = null;
    private socket?: WebSocket;
    private latest?: ServerState;
    private pending: Command[] = [];
    private batch: Command[] = [];
    private seq = 0;
    private rtt = 0;
    private connected = false;
    private stopped = false;
    private retry = 500;
    private readonly prediction: WorldPrediction;
    private timers = new Set<ReturnType<typeof setTimeout>>();
    private pingTimer: ReturnType<typeof setInterval>;
    private latency: number;

    constructor(
        private readonly simulation: Simulation,
        latency = 0,
        private readonly membership?: {
            roomId: string;
            memberId: string;
            progress?: () => MatchProgress | undefined;
        },
    ) {
        this.prediction = new WorldPrediction(simulation);
        this.latency = Math.max(0, Math.min(500, latency));
        this.connect();
        this.pingTimer = setInterval(
            () => this.send({ type: 'ping', sent: performance.now() }),
            1000,
        );
    }
    get canResetMatch() {
        return !this.membership && this.canReset;
    }
    get playing() {
        return this.connected && !!this.latest?.ready;
    }
    get canReset() {
        return (
            (!this.membership || !!this.latest?.ready) &&
            this.seat !== null &&
            (this.latest?.hostSeat ?? this.latest?.game.players.findIndex((p) => p.active)) ===
                this.seat
        );
    }
    get label() {
        return `ONLINE / DO ${RULES.maxPlayers} GRACZY / ${this.seat === null ? 'WIDZ' : `TY: ${String.fromCharCode(65 + this.seat)} · ${this.seat % 2 === 0 ? 'NIEBIESCY' : 'POMARAŃCZOWI'}`}`;
    }
    get status() {
        if (!this.connected) return 'Łączenie z serwerem…';
        if (this.membership?.progress?.()?.phase === 'finished')
            return 'Mecz zakończony — rewanż uruchamia gospodarz w pokoju.';
        if (!this.latest?.ready)
            return this.membership
                ? 'Czekamy na rozpoczęcie meczu przez gospodarza.'
                : 'Czekamy na przeciwną drużynę — otwórz ten link w kolejnej przeglądarce';
        if (this.seat === null)
            return this.membership
                ? 'Obserwujesz mecz.'
                : 'Oglądasz mecz — wszystkie miejsca są zajęte';
        return null;
    }
    get debug() {
        return `RTT ${Math.round(this.rtt)} ms · dodatkowy RTT ${this.latency} ms · tick ${this.latest?.tick ?? 0} · oczekujące ${this.pending.length} · korekta ${this.prediction.correctionSize.toFixed(3)}`;
    }
    private later(action: () => void, ms: number) {
        if (this.stopped) return;
        const timer = setTimeout(() => {
            this.timers.delete(timer);
            if (!this.stopped) action();
        }, ms);
        this.timers.add(timer);
    }
    private connect() {
        if (this.stopped) return;
        const query = this.membership
            ? `?room=${encodeURIComponent(this.membership.roomId)}&member=${encodeURIComponent(this.membership.memberId)}`
            : '';
        const socket = new WebSocket(
            `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/game${query}`,
        );
        this.socket = socket;
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data) as ServerMessage;
            this.later(() => {
                if (socket === this.socket) this.receive(message);
            }, this.latency / 2);
        };
        socket.onclose = () => {
            if (this.stopped || socket !== this.socket) return;
            this.connected = false;
            this.latest = undefined;
            this.pending = [];
            this.batch = [];
            this.later(() => this.connect(), this.retry);
            this.retry = Math.min(5000, this.retry * 2);
        };
        socket.onerror = () => socket.close();
    }
    private send(message: ClientMessage) {
        const socket = this.socket;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        const data = JSON.stringify(message);
        this.later(() => {
            if (
                socket === this.socket &&
                socket.readyState === WebSocket.OPEN &&
                socket.bufferedAmount < 32768
            )
                socket.send(data);
        }, this.latency / 2);
    }
    private receive(message: ServerMessage) {
        if (message.type === 'welcome') {
            this.latest = undefined;
            this.seat = message.seat;
            this.seq = 0;
            this.pending = [];
            this.batch = [];
            this.connected = true;
            this.retry = 500;
            return;
        }
        if (message.type === 'pong') {
            this.rtt = performance.now() - message.sent;
            return;
        }
        const reset = !this.latest || this.latest.game.epoch !== message.game.epoch;
        this.latest = message;
        if (reset) {
            this.pending = [];
            this.batch = [];
        }
        if (this.seat !== null)
            this.pending = this.pending.filter((c) => c.seq > message.ack[this.seat!]);
        this.prediction.reconcile(message, this.seat, this.pending);
    }
    step(input: Input) {
        if (!this.connected || !this.latest) return;
        if (this.seat === null) {
            this.prediction.step(input);
            return;
        }
        const command = { ...input, seq: ++this.seq };
        this.pending.push(command);
        this.batch.push(command);
        if (this.pending.length > 120) {
            this.socket?.close();
            return;
        }
        if (this.batch.length >= 2) {
            this.send({ type: 'input', epoch: this.latest.game.epoch, commands: this.batch });
            this.batch = [];
        }
        this.prediction.step(input);
    }
    snapshot(): GameSnapshot {
        return this.prediction.snapshot();
    }
    reset(match: boolean) {
        if (this.canReset && (!match || this.canResetMatch)) this.send({ type: 'reset', match });
    }
    release() {
        this.batch = [];
        this.send({ type: 'release' });
    }
    dispose() {
        this.stopped = true;
        clearInterval(this.pingTimer);
        for (const timer of this.timers) clearTimeout(timer);
        this.timers.clear();
        this.socket?.close();
        this.simulation.dispose();
    }
}
