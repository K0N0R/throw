import p2 from 'p2';

import { calculateVectorLength, normalizeVector, getNormalizedVector } from './../../shared/vector';
import { player_config } from './../../shared/callibration';
import { Team } from './../../shared/team';

import { MAP_BORDER, PLAYER, BALL, GOAL_POST } from './collision';
import { IPos } from './../../shared/model';
import { User } from './../lobby/user';
import { KeysMap } from './../../shared/keysHandler';

export class Player {
    public body!: p2.Body;
    private shape!: p2.Circle;
    public keysMap: Partial<KeysMap> = {};

    public shootingCooldown!: boolean;
    public shooting!: boolean;
    public dashing!: boolean;

    public get maxSpeed(): number {
        if (this.shooting) {
            return player_config.shootingMaxSpeed;
        }

        return player_config.maxSpeed;
    } 

    public constructor(
        public user: User,
        public nick: string,
        public avatar: string,
        public team: Team, 
        material: p2.Material,
        initPos: IPos) {

        let options: p2.BodyOptions = {
            mass: player_config.mass,
            position: [initPos.x, initPos.y],
            velocity: [0, 0],
        };
        this.body = new p2.Body(options);
        this.shape = new p2.Circle({
            radius: player_config.radius,
            collisionGroup: PLAYER,
            collisionMask: PLAYER | MAP_BORDER | BALL | GOAL_POST 
        });
        this.shape.material = material;
        this.body.addShape(this.shape);
        this.body.damping = player_config.damping;
    }

    public shoot(): void {
        this.shootingCooldown = true;
        setTimeout(() => {
            this.shootingCooldown = false;
        }, player_config.shootingCooldown);
    }

    public dash(): void {
        if (!this.dashing) {
            this.dashing = true;
            const initVelocity = {x: this.body.velocity[0], y: this.body.velocity[1]};
            const dashingVector = getNormalizedVector(
                { x: this.body.position[0], y: this.body.position[1] },
                { x: this.body.position[0] + initVelocity.x, y: this.body.position[1] + initVelocity.y }
            ); 
            this.body.velocity[0] = (dashingVector.x * player_config.dashing);
            this.body.velocity[1] = (dashingVector.y * player_config.dashing);
            setTimeout(() => {
                this.body.velocity[0] = initVelocity.x;
                this.body.velocity[1] = initVelocity.y;
                setTimeout(() => {
                    this.dashing = false;
                }, player_config.dashCooldown)
            }, player_config.dashDuration);
        }
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
            this.dash();
        }
        this.onMovmentChange();
    }
}