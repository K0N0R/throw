import p2 from 'p2';

import { calculateVectorLength, normalizeVector, getNormalizedVector } from './../../shared/vector';
import { game_config, map_config, MapKind } from './../../shared/callibration';
import { Team } from './../../shared/team';

import { MAP_BORDER, PLAYER, BALL, GOAL_POST } from './collision';
import { IPos } from './../../shared/model';
import { User } from './../lobby/user';
import { KeysMap } from './../../shared/keysHandler';
import { POWERUP_KIND } from './../../shared/powerup';

export class Player {
    public body!: p2.Body;
    private shape!: p2.Circle;
    public keysMap: Partial<KeysMap> = {};
    public power: POWERUP_KIND | null = null;

    public shootingCooldown!: boolean;
    public shooting!: boolean;
    public dashing!: boolean;

    public get maxSpeed(): number {
        if (this.shooting) {
            return game_config.player.shootingMovementSpeed;
        }
        return game_config.player.movementSpeed;
    }

    public constructor(
        private mapKind: MapKind,
        public user: User,
        public nick: string,
        public avatar: string,
        public team: Team,
        material: p2.Material,
        initPos: IPos) {

        let options: p2.BodyOptions = {
            mass: game_config.player.mass,
            position: [initPos.x, initPos.y],
            velocity: [0, 0],
        };
        this.body = new p2.Body(options);
        this.shape = new p2.Circle({
            radius: map_config[this.mapKind].player.radius,
            collisionGroup: PLAYER,
            collisionMask: PLAYER | MAP_BORDER | BALL | GOAL_POST
        });
        this.shape.material = material;
        this.body.addShape(this.shape);
        this.body.damping = game_config.player.damping;
    }

    public shoot(): void {
        this.shootingCooldown = true;
        setTimeout(() => {
            this.shootingCooldown = false;
        }, game_config.player.shootingCooldown);
    }

    public dash(vector: IPos): void {
        if (this.power !== POWERUP_KIND.DASH || this.dashing) return;
        this.dashing = true;
        const initVelocity = {x: this.body.velocity[0], y: this.body.velocity[1]};
        const dashingVector = getNormalizedVector(
            { x: this.body.position[0], y: this.body.position[1] },
            { x: this.body.position[0] + vector.x, y: this.body.position[1] + vector.y }
        );

        let dashingTime = 0;
        let dashingSpeedScale = 0.2;
        let dashingSpeedScaleMultipiler = 0.01
        const interval = setInterval(() => {
            this.body.velocity[0] = (initVelocity.x + dashingVector.x * game_config.player.dashingMaxSpeed * dashingSpeedScale);
            this.body.velocity[1] = (initVelocity.y + dashingVector.y * game_config.player.dashingMaxSpeed * dashingSpeedScale);
            dashingSpeedScaleMultipiler *= 2;
            dashingSpeedScale+= dashingSpeedScaleMultipiler;
            if (dashingSpeedScale > 1) dashingSpeedScale = 1;
            dashingTime += game_config.player.dashingTick;
            if (dashingTime > game_config.player.dashDuration) {
                clearInterval(interval);
                const moveVector = { x: this.body.velocity[0], y: this.body.velocity[1] };
                const normalizedMoveVector = normalizeVector(moveVector);
                this.body.velocity[0] = normalizedMoveVector.x * this.maxSpeed / 20;
                this.body.velocity[1] = normalizedMoveVector.y * this.maxSpeed / 20;
                this.dashing = false;
                this.power = null;
            }
        }, game_config.player.dashingTick);

    }

    public onMovmentChange(): void {
        const moveVector = { x: this.body.force[0], y: this.body.force[1] };
        const movmentLength = calculateVectorLength(moveVector);
        if (movmentLength > this.maxSpeed) {
            const normalizedMoveVector = normalizeVector(moveVector);
            this.body.force[0] = normalizedMoveVector.x * this.maxSpeed;
            this.body.force[1] = normalizedMoveVector.y * this.maxSpeed;
        }
    }
    public counter = 0;
    public logic(): void {

        if (this.keysMap.up) {
            this.body.force[1] = -this.maxSpeed;
        }
        if (this.keysMap.down) {
            this.body.force[1] = +this.maxSpeed;
        }
        if (this.keysMap.left) {
            this.body.force[0] = -this.maxSpeed;
        }
        if (this.keysMap.right) {
            this.body.force[0] = +this.maxSpeed;
        }
        this.shooting = Boolean(this.keysMap.shoot);

        if (this.keysMap.dash && (this.keysMap.up || this.keysMap.down || this.keysMap.left || this.keysMap.right)) {
            const vector: IPos = {
                y: this.keysMap.down ? 1 : (this.keysMap.up ? -1 : 0),
                x: this.keysMap.right ? 1 : (this.keysMap.left ? -1 : 0)
            }
            this.dash(vector);
        }
        this.onMovmentChange();
    }
}
