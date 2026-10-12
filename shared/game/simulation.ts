import RAPIER from '@dimforge/rapier2d-compat';

export const RULES = {
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
}
export interface Position {
    x: number;
    y: number;
}
export interface BodyState extends Position {
    velocity: Position;
    shooting: boolean;
}
export interface GameSnapshot {
    players: BodyState[];
    ballState: BodyState;
    cooldowns: number[];
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
    private epoch = 0;
    private kickSerial = 0;
    private score: [number, number] = [0, 0];
    private pause = 0;
    private cooldowns: number[] = [];
    private shooting: boolean[] = [];
    private lastScorer: 'left' | 'right' | null = null;

    static async create(multiplayer = false) {
        await RAPIER.init();
        return new Simulation(multiplayer);
    }

    private constructor(multiplayer: boolean) {
        this.world = new RAPIER.World({ x: 0, y: 0 });
        this.world.timestep = RULES.timestep;
        this.world.integrationParameters.numSolverIterations = 8;
        this.world.integrationParameters.normalizedPredictionDistance = 0.1;
        // Membership: ball = 1, player = 2, walls = 4.
        const wall = (x: number, y: number, hx: number, hy: number, filter = 3) => {
            this.world.createCollider(
                RAPIER.ColliderDesc.cuboid(hx, hy)
                    .setTranslation(x, y)
                    .setFriction(0)
                    .setRestitution(0.75)
                    .setCollisionGroups((4 << 16) | filter),
            );
        };
        const { width: w, height: h, goalHeight: gh, goalDepth: gd } = RULES;
        wall(w / 2, -0.2, w / 2 + gd, 0.2);
        wall(w / 2, h + 0.2, w / 2 + gd, 0.2);
        for (const x of [-0.2, w + 0.2]) {
            wall(x, (h - gh) / 4, 0.2, (h - gh) / 4, 1);
            wall(x, h - (h - gh) / 4, 0.2, (h - gh) / 4, 1);
            wall(x, h / 2, 0.2, h / 2, 2);
        }
        for (const x of [-gd / 2, w + gd / 2]) {
            wall(x, (h - gh) / 2 - 0.1, gd / 2, 0.1, 1);
            wall(x, (h + gh) / 2 + 0.1, gd / 2, 0.1, 1);
        }
        wall(-gd - 0.2, h / 2, 0.2, gh / 2, 1);
        wall(w + gd + 0.2, h / 2, 0.2, gh / 2, 1);
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
        if (multiplayer) {
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
        this.resetRound();
    }

    resetRound() {
        for (const [body, x] of [
            ...this.players.map(
                (body, index) => [body, RULES.width / 2 + (index === 0 ? -2 : 2)] as const,
            ),
            [this.ball, RULES.width / 2],
        ] as const) {
            body.setTranslation({ x, y: RULES.height / 2 }, true);
            body.setLinvel({ x: 0, y: 0 }, true);
            body.resetForces(true);
            body.resetTorques(true);
            body.setAngvel(0, true);
        }
        this.pause = 0;
        this.cooldowns = this.players.map(() => 0);
        this.shooting = this.players.map(() => false);
        this.epoch++;
        this.lastScorer = null;
    }
    resetMatch() {
        this.score = [0, 0];
        this.resetRound();
    }

    step(inputs: Input | Input[], authoritative = true, predictedSeat?: number) {
        const dt = RULES.timestep;
        // The goal window delays kickoff only; physics, movement and kicks continue.
        // Clients keep simulating until the server publishes the new epoch.
        if (this.pause > 0 && authoritative) {
            this.pause -= dt;
            if (this.pause <= 0) {
                this.resetRound();
                return;
            }
        }
        this.players.forEach((player, index) => {
            const input = Array.isArray(inputs)
                ? (inputs[index] ?? { x: 0, y: 0, shoot: false })
                : index === 0
                  ? inputs
                  : { x: 0, y: 0, shoot: false };
            this.shooting[index] = input.shoot;
            this.cooldowns[index] = Math.max(0, this.cooldowns[index] - dt);
            const length = Math.hypot(input.x, input.y);
            const speed = input.shoot ? RULES.shootingSpeed : RULES.speed;
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
                (other) =>
                    other !== player &&
                    Math.hypot(
                        other.translation().x - player.translation().x,
                        other.translation().y - player.translation().y,
                    ) <
                        RULES.playerRadius * 2 + 0.05,
            );
            const acceleration =
                !length && touchingPlayer ? RULES.acceleration * 0.12 : RULES.acceleration;
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
        const b = this.ball.translation();
        const inGoal =
            b.y > (RULES.height - RULES.goalHeight) / 2 &&
            b.y < (RULES.height + RULES.goalHeight) / 2;
        if (
            authoritative &&
            this.lastScorer === null &&
            inGoal &&
            (b.x < -RULES.ballRadius || b.x > RULES.width + RULES.ballRadius)
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
        });
        return {
            players: this.players.map(bodyState),
            ballState: bodyState(this.ball, this.players.length),
            cooldowns: [...this.cooldowns],
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
        [...this.players, this.ball].forEach((body, index) => {
            const value = index < this.players.length ? state.players[index] : state.ballState;
            body.setTranslation({ x: value.x, y: value.y }, true);
            body.setLinvel(value.velocity, true);
            body.resetForces(true);
        });
        this.cooldowns = [...state.cooldowns];
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
