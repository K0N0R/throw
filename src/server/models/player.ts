import * as p2 from 'p2';
import io from 'socket.io';

import { calculateVectorLength, normalizeVector } from './../../shared/vector';
import { Keys } from './../../shared/keys';
import { player_config } from './../../shared/callibration';
import { Team } from './../../shared/team';

import { MAP_BORDER, PLAYER, BALL, GOAL_POST } from './collision';

export class Player {
    public socketId: string;
    public body!: p2.Body;
    private shape!: p2.Circle;

    public shooting!: boolean;

    public movementIncrease!: number;
    public maxSpeed!: number;
    public team: Team

    public constructor(socketId: string, material: p2.Material) {

        this.socketId = socketId;
        let options: p2.BodyOptions = {
            mass: player_config.mass,
            position: [0, 0],
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

        this.sprintHandler();
    }

    public shootingStrongHandler(pressed: boolean): void {
        this.shooting = pressed;
    }

    public sprintHandler(pressed: boolean = false): void {
        if (pressed) {
            this.movementIncrease = player_config.sprintMovementIncrease;
            this.maxSpeed = player_config.sprintMaxSpeed;
        } else {
            this.movementIncrease = player_config.movementIncrease;
            this.maxSpeed = player_config.maxSpeed;
        }
    }

    public movementKeysHandler(key: Keys): void {
        if (key == Keys.Up) {
            this.body.velocity[1] -= this.movementIncrease;
        }
        if (key == Keys.Down) {
            this.body.velocity[1] += this.movementIncrease;
        }
        if (key == Keys.Left) {
            this.body.velocity[0] -= this.movementIncrease;
        }
        if (key == Keys.Right) {
            this.body.velocity[0] += this.movementIncrease;
        }

        const moveVector = { x: this.body.velocity[0], y: this.body.velocity[1] };
        const movmentLength = calculateVectorLength(moveVector);
        if (movmentLength > this.maxSpeed) {
            const normalizedMoveVector = normalizeVector(moveVector);
            this.body.velocity[0] = normalizedMoveVector.x * this.maxSpeed;
            this.body.velocity[1] = normalizedMoveVector.y * this.maxSpeed;
        }
    }
}