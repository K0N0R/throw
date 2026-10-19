import { projectToArena } from './arenas';
import {
    Simulation,
    RULES,
    projectKickoffPlayer,
    type GameSnapshot,
    type Input,
    type Position,
} from './simulation';
import type { Command, ServerState } from './protocol';

// All interacting bodies are predicted and displayed at the same simulation time.
export class WorldPrediction {
    private latest?: ServerState;
    private seat: number | null = null;
    private offsets: Position[] = [];
    correctionSize = 0;

    constructor(private readonly simulation: Simulation) {}

    reconcile(state: ServerState, seat: number | null, pending: Command[]) {
        const before = this.simulation.snapshot();
        const reset =
            !this.latest ||
            this.latest.game.epoch !== state.game.epoch ||
            this.latest.ready !== state.ready;
        this.latest = state;
        this.seat = seat;
        this.simulation.restore(state.game);
        if (state.ready && seat !== null)
            for (const command of pending) {
                const inputs = state.inputs.map((input) => ({ ...input }));
                inputs[seat] = command;
                this.simulation.step(inputs, false, seat);
            }
        const after = this.simulation.snapshot();
        const previousBodies = [...before.players, before.ball];
        const bodies = [...after.players, after.ball];
        this.correctionSize =
            seat === null
                ? 0
                : Math.hypot(
                      before.players[seat].x - after.players[seat].x,
                      before.players[seat].y - after.players[seat].y,
                  );
        this.offsets = bodies.map((body, i) => {
            const dx = previousBodies[i].x - body.x,
                dy = previousBodies[i].y - body.y;
            if (reset || !state.ready) return { x: 0, y: 0 };
            const offset = this.offsets[i] ?? { x: 0, y: 0 };
            const x = offset.x + dx,
                y = offset.y + dy;
            return { x, y };
        });
    }

    step(input: Input) {
        if (!this.latest?.ready) return;
        const inputs = this.latest.inputs.map((v) => ({ ...v }));
        if (this.seat !== null) inputs[this.seat] = input;
        this.simulation.step(inputs, false, this.seat ?? -1);
        this.offsets.forEach((offset, index) => {
            const duration =
                index === this.seat ? 0.06 : index < this.simulation.players.length ? 0.12 : 0.09;
            const decay = Math.exp(-RULES.timestep / duration);
            const length = Math.hypot(offset.x, offset.y);
            const maxSpeed = index < this.simulation.players.length ? RULES.speed : RULES.kickSpeed;
            const reduction = length
                ? Math.min(1 - decay, (maxSpeed * RULES.timestep) / length)
                : 0;
            offset.x *= 1 - reduction;
            offset.y *= 1 - reduction;
        });
    }

    private presentation(state: GameSnapshot): Position[] {
        const physical = [...state.players, state.ball];
        const bodies = physical.map((p, i) => ({
            x: p.x + (this.offsets[i]?.x ?? 0),
            y: p.y + (this.offsets[i]?.y ?? 0),
        }));
        const radius = (i: number) =>
            i < state.players.length ? RULES.playerRadius : RULES.ballRadius;
        // Resolve only visual penetrations. Never discard an entire smoothing offset on contact.
        for (let pass = 0; pass < 4; pass++) {
            for (let i = 0; i < bodies.length; i++)
                for (let j = i + 1; j < bodies.length; j++) {
                    if (
                        (i < state.players.length && !state.players[i].active) ||
                        (j < state.players.length && !state.players[j].active)
                    )
                        continue;
                    const a = bodies[i],
                        b = bodies[j];
                    let dx = b.x - a.x,
                        dy = b.y - a.y,
                        distance = Math.hypot(dx, dy);
                    const separation = radius(i) + radius(j);
                    if (distance >= separation) continue;
                    if (distance < 0.0001) {
                        dx = physical[j].x - physical[i].x;
                        dy = physical[j].y - physical[i].y;
                        distance = Math.hypot(dx, dy);
                        if (distance < 0.0001) {
                            dx = 1;
                            dy = 0;
                            distance = 1;
                        }
                    }
                    const nx = dx / distance,
                        ny = dy / distance;
                    const depth = separation - Math.hypot(b.x - a.x, b.y - a.y);
                    const share =
                        i === this.seat
                            ? 0.1
                            : j === this.seat
                              ? 0.9
                              : j === state.players.length
                                ? 0.1
                                : 0.5;
                    a.x -= nx * depth * share;
                    a.y -= ny * depth * share;
                    b.x += nx * depth * (1 - share);
                    b.y += ny * depth * (1 - share);
                }
            bodies.forEach((body, i) => {
                const r = radius(i);
                Object.assign(
                    body,
                    projectToArena(body, r, state.arena, i === state.players.length),
                );
                if (i < state.players.length && state.players[i].active)
                    Object.assign(
                        body,
                        projectKickoffPlayer(body, i, state.kickoffTeam, state.arena),
                    );
            });
        }
        return bodies;
    }

    snapshot(): GameSnapshot {
        const state = this.simulation.snapshot();
        if (!this.latest) return state;
        const bodies = this.presentation(state);
        const players = state.players.map((p, i) => ({ ...p, ...bodies[i] }));
        return {
            ...state,
            players,
            player: players[this.seat ?? 0],
            ball: bodies[state.players.length],
            score: this.latest.game.score,
            phase: this.latest.game.phase,
            lastScorer: this.latest.game.lastScorer,
            kickReady: this.seat !== null && state.cooldowns[this.seat] === 0,
        };
    }
}
