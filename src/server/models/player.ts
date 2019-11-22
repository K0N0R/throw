import * as p2 from 'p2';
import io from 'socket.io';

import { Keys } from './keys';
import { MAP_BORDER, PLAYER, BALL, GOAL_POST } from './collision';
import { calculateVectorLength, normalizeVector } from './../utils/vector';

import { player } from './callibration';
import { Team } from './team';

export class Player {
    public socket: io.Socket;
    public body!: p2.Body;
    private shape!: p2.Circle;

        private keysPressed: { [param: number]: boolean };
    public shootingStrong!: boolean;
    public shootingWeak!: boolean;

    public movementIncrease!: number;
    public maxSpeed!: number;
    public team: Team

    public constructor(socket: io.Socket, material: p2.Material) {

        this.socket = socket;
        let options: p2.BodyOptions = {
            mass: player.mass,
            position: [0, 0],
            velocity: [0, 0],
        };
        this.body = new p2.Body(options);
        this.shape = new p2.Circle({
            radius: player.radius,
            collisionGroup: PLAYER,
            collisionMask: PLAYER | MAP_BORDER | BALL | GOAL_POST 
        });
        this.shape.material = material;
        this.body.addShape(this.shape);
        this.body.damping = player.damping;

        this.sprintHandler();
    }

    public shootingStrongHandler(pressed: boolean): void {
        this.shootingStrong = pressed;
    }

    public shootingWeakHandler(pressed: boolean): void {
        this.shootingWeak = pressed;
    }

    public sprintHandler(pressed: boolean = false): void {
        if (pressed) {
            this.movementIncrease = player.sprintMaxSpeed;
            this.maxSpeed = player.sprintMaxSpeed;
        } else {
            this.movementIncrease = player.movementIncrease;
            this.maxSpeed = player.maxSpeed;
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