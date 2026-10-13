import {
    arenaSettings,
    arenaShape,
    cornerWalls,
    arenaEnergyPads,
    DEFAULT_ARENA,
    type ArenaSettings,
} from './arenas';
import { EnergySystem, ENERGY_RULES } from './energy';
import RAPIER from '@dimforge/rapier2d-compat';

export const RULES = {
    maxPlayers: 10,
    width: 24,
    height: 12,
    goalHeight: 3.6,
    goalDepth: 1.4,
    playerRadius: 0.48,
    ballRadius: 0.32,
    timestep: 1 / 60,
    speed: 6,
    shootingSpeed: 3.6,
    acceleration: 32,
    kickSpeed: 14,
    kickRange: 0.32,
    kickCooldown: 0.22,
    goalPause: 1.3,
};
export interface Input {
    x: number;
    y: number;
    shoot: boolean;
    boost?: boolean;
}
export interface Position {
    x: number;
    y: number;
}
export interface BodyState extends Position {
    velocity: Position;
    shooting: boolean;
    active: boolean;
}
export interface GameSnapshot {
    arena: ArenaSettings;
    players: BodyState[];
    ballState: BodyState;
    cooldowns: number[];
    energy: number[];
    boosting: boolean[];
    padCooldowns: number[];
    pause: number;
    epoch: number;
    player: Position;
    ball: Position;
    score: [number, number];
    phase: 'playing' | 'goal';
    lastScorer: 'left' | 'right' | null;
    kickReady: boolean;
    kickSerial: number;
}

// Independent of Pixi, DOM and networking; also runnable in Node.
export class Simulation {
    readonly world: RAPIER.World;
    readonly player: RAPIER.RigidBody;
    readonly ball: RAPIER.RigidBody;
    readonly players: RAPIER.RigidBody[] = [];
    arena: ArenaSettings = { ...DEFAULT_ARENA };
    private walls: RAPIER.Collider[] = [];
    get field() {
        return arenaShape(this.arena);
    }
    private readonly energySystem = new EnergySystem();
    private epoch = 0;
    private kickSerial = 0;
    private score: [number, number] = [0, 0];
    private pause = 0;
    private cooldowns: number[] = [];
    private shooting: boolean[] = [];
    private activePlayers: boolean[] = [];
    private lastScorer: 'left' | 'right' | null = null;

    static async create(
        multiplayer: boolean | number = false,
        arena: ArenaSettings = DEFAULT_ARENA,
    ) {
        await RAPIER.init();
        return new Simulation(multiplayer, arena);
    }

    private constructor(multiplayer: boolean | number, arena: ArenaSettings) {
        this.world = new RAPIER.World({ x: 0, y: 0 });
        this.world.timestep = RULES.timestep;
        this.world.integrationParameters.numSolverIterations = 8;
        this.world.integrationParameters.normalizedPredictionDistance = 0.1;
        this.arena = arenaSettings(arena);
        this.buildWalls();
        this.player = this.world.createRigidBody(
            RAPIER.RigidBodyDesc.dynamic().lockRotations().setLinearDamping(0).setCcdEnabled(true),
        );
        this.world.createCollider(
            RAPIER.ColliderDesc.ball(RULES.playerRadius)
                .setMass(2)
                .setFriction(0)
                .setRestitution(0)
                .setCollisionGroups((2 << 16) | 7),
            this.player,
        );
        this.ball = this.world.createRigidBody(
            RAPIER.RigidBodyDesc.dynamic()
                .lockRotations()
                .setLinearDamping(0.55)
                .setCcdEnabled(true),
        );
        this.world.createCollider(
            RAPIER.ColliderDesc.ball(RULES.ballRadius)
                .setMass(0.5)
                .setFriction(0)
                .setRestitution(0.75)
                .setCollisionGroups((1 << 16) | 7),
            this.ball,
        );
        this.players.push(this.player);
        const count =
            typeof multiplayer === 'number'
                ? Math.max(1, Math.min(RULES.maxPlayers, Math.floor(multiplayer)))
                : multiplayer
                  ? 2
                  : 1;
        for (let index = 1; index < count; index++) {
            const opponent = this.world.createRigidBody(
                RAPIER.RigidBodyDesc.dynamic()
                    .lockRotations()
                    .setLinearDamping(0)
                    .setCcdEnabled(true),
            );
            this.world.createCollider(
                RAPIER.ColliderDesc.ball(RULES.playerRadius)
                    .setMass(2)
                    .setFriction(0)
                    .setRestitution(0)
                    .setCollisionGroups((2 << 16) | 7),
                opponent,
            );
            this.players.push(opponent);
        }
        this.activePlayers = this.players.map(() => true);
        this.resetRound();
    }

    private buildWalls() {
        for (const collider of this.walls) this.world.removeCollider(collider, true);
        this.walls = [];
        const wall = (x: number, y: number, hx: number, hy: number, filter = 3, rotation = 0) => {
            if (hx <= 0 || hy <= 0) return;
            this.walls.push(
                this.world.createCollider(
                    RAPIER.ColliderDesc.cuboid(hx, hy)
                        .setTranslation(x, y)
                        .setRotation(rotation)
                        .setFriction(0)
                        .setRestitution(0.75)
                        .setCollisionGroups((4 << 16) | filter),
                ),
            );
        };
        const { width: w, height: h, goalHeight: gh, goalDepth: gd, cornerRadius: r } = this.field;
        wall(w / 2, -0.2, w / 2 - r, 0.2);
        wall(w / 2, h + 0.2, w / 2 - r, 0.2);
        const top = (h - gh) / 2,
            bottom = (h + gh) / 2;
        for (const x of [-0.2, w + 0.2]) {
            wall(x, (r + top) / 2, 0.2, (top - r) / 2, 1);
            wall(x, (bottom + h - r) / 2, 0.2, (h - r - bottom) / 2, 1);
            wall(x, h / 2, 0.2, h / 2 - r, 2);
        }
        for (const segment of cornerWalls(this.arena)) {
            const dx = segment.b.x - segment.a.x,
                dy = segment.b.y - segment.a.y;
            wall(
                (segment.a.x + segment.b.x) / 2 + segment.outward.x * 0.2,
                (segment.a.y + segment.b.y) / 2 + segment.outward.y * 0.2,
                Math.hypot(dx, dy) / 2 + 0.015,
                0.2,
                3,
                Math.atan2(dy, dx),
            );
        }
        for (const x of [-gd / 2, w + gd / 2]) {
            wall(x, top - 0.1, gd / 2, 0.1, 1);
            wall(x, bottom + 0.1, gd / 2, 0.1, 1);
        }
        wall(-gd - 0.2, h / 2, 0.2, gh / 2, 1);
        wall(w + gd + 0.2, h / 2, 0.2, gh / 2, 1);
    }
    configureArena(settings: ArenaSettings) {
        this.arena = arenaSettings(settings);
        this.buildWalls();
        this.resetRound();
    }

    setConnectedSeats(seats: number[]) {
        this.activePlayers = this.players.map((body, index) => {
            const active = seats.includes(index);
            body.setEnabled(active);
            return active;
        });
    }

    spawnSeat(seat: number) {
        const body = this.players[seat];
        const x = seat % 2 === 0 ? 3 : this.field.width - 3;
        let y = this.field.height / 2;
        for (let candidate = 1; candidate <= this.field.height - 1; candidate += 1.25) {
            if (
                this.players.every(
                    (other, index) =>
                        index === seat ||
                        !this.activePlayers[index] ||
                        Math.hypot(other.translation().x - x, other.translation().y - candidate) >
                            RULES.playerRadius * 2 + 0.1,
                )
            ) {
                y = candidate;
                break;
            }
        }
        body.setTranslation({ x, y }, true);
        body.setLinvel({ x: 0, y: 0 }, true);
        body.setAngvel(0, true);
        body.resetForces(true);
        body.resetTorques(true);
        this.cooldowns[seat] = 0;
        this.shooting[seat] = false;
        this.energySystem.energy[seat] = 0;
        this.energySystem.boosting[seat] = false;
    }

    resetRound() {
        for (const [body, x, y] of [
            ...this.players.map((body, index) => {
                const team = this.players
                    .map((_, seat) => seat)
                    .filter((seat) => this.activePlayers[seat] && seat % 2 === index % 2);
                const row = this.activePlayers[index]
                    ? team.indexOf(index) - (team.length - 1) / 2
                    : 0;
                return [
                    body,
                    this.field.width / 2 + (index % 2 === 0 ? -2 : 2),
                    this.field.height / 2 + row * 1.6,
                ] as const;
            }),
            [this.ball, this.field.width / 2, this.field.height / 2],
        ] as const) {
            body.setTranslation({ x, y }, true);
            body.setLinvel({ x: 0, y: 0 }, true);
            body.resetForces(true);
            body.resetTorques(true);
            body.setAngvel(0, true);
        }
        this.pause = 0;
        this.energySystem.reset(this.players.length, this.arena);
        this.cooldowns = this.players.map(() => 0);
        this.shooting = this.players.map(() => false);
        this.epoch++;
        this.lastScorer = null;
    }
    resetMatch() {
        this.score = [0, 0];
        this.resetRound();
    }

    step(
        inputs: Input | Input[],
        authoritative = true,
        predictedSeat?: number,
        allowKickoff = true,
    ) {
        const dt = RULES.timestep;
        // The goal window delays kickoff only; physics, movement and kicks continue.
        // Clients keep simulating until the server publishes the new epoch.
        if (this.pause > 0 && authoritative) {
            this.pause -= dt;
            if (this.pause <= 0 && allowKickoff) {
                this.resetRound();
                return;
            }
        }
        this.energySystem.tick(dt);
        this.players.forEach((player, index) => {
            if (!this.activePlayers[index]) return;
            const input = Array.isArray(inputs)
                ? (inputs[index] ?? { x: 0, y: 0, shoot: false })
                : index === 0
                  ? inputs
                  : { x: 0, y: 0, shoot: false };
            this.shooting[index] = input.shoot;
            this.cooldowns[index] = Math.max(0, this.cooldowns[index] - dt);
            const length = Math.hypot(input.x, input.y);
            const boosting = this.energySystem.boost(
                index,
                !!input.boost && length > 0 && !input.shoot,
                dt,
            );
            const speed = input.shoot
                ? RULES.shootingSpeed
                : boosting
                  ? ENERGY_RULES.speed
                  : RULES.speed;
            const v = player.linvel();
            const target = {
                x: length ? (input.x / length) * speed : 0,
                y: length ? (input.y / length) * speed : 0,
            };
            const dxv = target.x - v.x,
                dyv = target.y - v.y;
            const change = Math.hypot(dxv, dyv);
            // Keep free movement unchanged; allow an idle player to yield to contact impulses.
            const touchingPlayer = this.players.some(
                (other, otherIndex) =>
                    this.activePlayers[otherIndex] &&
                    other !== player &&
                    Math.hypot(
                        other.translation().x - player.translation().x,
                        other.translation().y - player.translation().y,
                    ) <
                        RULES.playerRadius * 2 + 0.05,
            );
            const acceleration =
                !length && touchingPlayer
                    ? RULES.acceleration * 0.12
                    : boosting
                      ? ENERGY_RULES.acceleration
                      : RULES.acceleration;
            const factor = change ? Math.min(1, (acceleration * dt) / change) : 0;
            player.setLinvel({ x: v.x + dxv * factor, y: v.y + dyv * factor }, true);
            if (
                input.shoot &&
                this.cooldowns[index] === 0 &&
                (authoritative || predictedSeat === undefined || predictedSeat === index)
            ) {
                const p = player.translation(),
                    b = this.ball.translation();
                const dx = b.x - p.x,
                    dy = b.y - p.y,
                    distance = Math.hypot(dx, dy);
                if (
                    distance < RULES.playerRadius + RULES.ballRadius + RULES.kickRange &&
                    distance > 0.0001
                ) {
                    const bv = this.ball.linvel();
                    this.ball.applyImpulse(
                        {
                            x:
                                this.ball.mass() *
                                ((dx / distance) * RULES.kickSpeed + v.x * 0.4 - bv.x),
                            y:
                                this.ball.mass() *
                                ((dy / distance) * RULES.kickSpeed + v.y * 0.4 - bv.y),
                        },
                        true,
                    );
                    this.cooldowns[index] = RULES.kickCooldown;
                    this.kickSerial++;
                }
            }
        });
        this.world.step();
        this.players.forEach((player, index) => {
            if (
                this.activePlayers[index] &&
                (authoritative || predictedSeat === undefined || predictedSeat === index)
            )
                this.energySystem.collect(index, player.translation(), RULES.playerRadius);
        });
        const b = this.ball.translation();
        const inGoal =
            b.y > (this.field.height - this.field.goalHeight) / 2 &&
            b.y < (this.field.height + this.field.goalHeight) / 2;
        if (
            authoritative &&
            this.lastScorer === null &&
            inGoal &&
            (b.x < -RULES.ballRadius || b.x > this.field.width + RULES.ballRadius)
        ) {
            this.lastScorer = b.x < 0 ? 'right' : 'left';
            this.score[this.lastScorer === 'left' ? 0 : 1]++;
            this.pause = RULES.goalPause;
        }
    }
    snapshot(): GameSnapshot {
        const bodyState = (body: RAPIER.RigidBody, index: number): BodyState => ({
            ...body.translation(),
            velocity: { ...body.linvel() },
            shooting: this.shooting[index] ?? false,
            active: this.activePlayers[index] ?? true,
        });
        return {
            arena: { ...this.arena },
            players: this.players.map(bodyState),
            ballState: bodyState(this.ball, this.players.length),
            cooldowns: [...this.cooldowns],
            energy: [...this.energySystem.energy],
            boosting: [...this.energySystem.boosting],
            padCooldowns: [...this.energySystem.padCooldowns],
            pause: this.pause,
            epoch: this.epoch,
            player: { ...this.player.translation() },
            ball: { ...this.ball.translation() },
            score: [...this.score],
            phase: this.pause > 0 ? 'goal' : 'playing',
            lastScorer: this.lastScorer,
            kickReady: this.cooldowns[0] === 0,
            kickSerial: this.kickSerial,
        };
    }
    restore(state: GameSnapshot) {
        const arena = arenaSettings(state.arena);
        if (arena.id !== this.arena.id) this.configureArena(arena);
        else this.arena = arena;
        [...this.players, this.ball].forEach((body, index) => {
            const value = index < this.players.length ? state.players[index] : state.ballState;
            body.setTranslation({ x: value.x, y: value.y }, true);
            body.setLinvel(value.velocity, true);
            body.resetForces(true);
        });
        this.setConnectedSeats(
            state.players.flatMap((player, index) => (player.active ? [index] : [])),
        );
        this.cooldowns = [...state.cooldowns];
        this.energySystem.energy = this.players.map((_, index) => state.energy?.[index] ?? 0);
        this.energySystem.boosting = this.players.map(
            (_, index) => state.boosting?.[index] ?? false,
        );
        this.energySystem.padCooldowns = arenaEnergyPads(this.arena).map(
            (_, index) => state.padCooldowns?.[index] ?? 0,
        );
        this.shooting = state.players.map((player) => player.shooting);
        this.pause = state.pause;
        this.score = [...state.score];
        this.lastScorer = state.lastScorer;
        this.epoch = state.epoch;
        this.kickSerial = state.kickSerial;
    }
    dispose() {
        this.world.free();
    }
}
