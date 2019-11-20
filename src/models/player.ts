import * as p2 from 'p2';

import { Canvas } from './canvas';
import { KeysHandler, Keys } from './keysHandler';
import { MAP_BORDER, PLAYER, BALL, GOAL_POST } from './collision';
import { calculateVectorLength, normalizeVector } from './../utils/vector';
import { Camera } from './camera';
import { player } from './callibration';

export class Player {
    public main: boolean;
    public body!: p2.Body;
    private shape!: p2.Circle;

    public shootingStrong!: boolean;
    public shootingWeak!: boolean;

    public movementIncrease!: number;
    public maxSpeed!: number;

    public constructor(position: [number, number], material: p2.Material, main: boolean) {

        this.main = main;
        let options: p2.BodyOptions = {
            mass: player.mass,
            position: position,
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

        if (this.main) {
            this.sprintHandler();
            this.addMovementHandlers();
        }
    }

    private addMovementHandlers(): void {
        KeysHandler.add(Keys.Up, (pressed: boolean) => { if (pressed) this.movementKeysHandler(Keys.Up); });
        KeysHandler.add(Keys.Down, (pressed: boolean) => { if (pressed) this.movementKeysHandler(Keys.Down); });
        KeysHandler.add(Keys.Left, (pressed: boolean) => { if (pressed) this.movementKeysHandler(Keys.Left); });
        KeysHandler.add(Keys.Right, (pressed: boolean) => { if (pressed) this.movementKeysHandler(Keys.Right); });
        KeysHandler.add(Keys.Shift, (pressed: boolean) => { this.sprintHandler(pressed); });
        KeysHandler.add(Keys.X, (pressed: boolean) => { this.shootingStrongHandler(pressed); });
        KeysHandler.add(Keys.C, (pressed: boolean) => { this.shootingWeakHandler(pressed); });
    }

    private shootingStrongHandler(pressed: boolean): void {
        this.shootingStrong = pressed;
    }

    private shootingWeakHandler(pressed: boolean): void {
        this.shootingWeak = pressed;
    }

    private sprintHandler(pressed: boolean = false): void {
        if (pressed) {
            this.movementIncrease = player.sprintMaxSpeed;
            this.maxSpeed = player.sprintMaxSpeed;
        } else {
            this.movementIncrease = player.movementIncrease;
            this.maxSpeed = player.maxSpeed;
        }
    }

    private movementKeysHandler(key: Keys): void {
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

    public logic(): void {
        if (this.main) {
            if (this.body.velocity[0] || this.body.velocity[1]) {
                Camera.updatePos({ x: this.body.position[0], y: this.body.position[1] });
            }
        }
    }

    public render(): void {
        Canvas.startDraw();
        Canvas.ctx.arc(this.body.position[0], this.body.position[1], this.shape.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = '#4663A0';
        Canvas.ctx.fill();
        Canvas.ctx.strokeStyle = this.shootingStrong || this.shootingWeak ? 'white' : 'black';
        Canvas.ctx.lineWidth = 3;
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}