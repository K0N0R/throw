import * as p2 from 'p2';

import { Canvas } from './canvas';
import { KeysHandler, Keys } from './keysHandler';
import { MAP_BORDER, PLAYER, BALL, GOAL_POST } from './collision';
import { calculateVectorLength, normalizeVector } from './../utils/vector';
import { Camera } from './camera';

export class Player {
    public main: boolean;
    public body!: p2.Body;
    private shape!: p2.Circle;
    private material: p2.Material;
    private position: [number, number];
    private radius = 25;
    private mass = 2;

    public shooting!: boolean;

    public movementSpeed!: number;
    public maxSpeed!: number;

    public constructor(position: [number, number], material: p2.Material, main: boolean) {
        this.position = position;
        this.material = material;
        this.main = main;
        this.createPhysics();
        this.resetMovmentSpeed();
        this.addMovementHandlers();
    }

    private createPhysics = (): void => {
        let options: p2.BodyOptions = {
            mass: this.mass,
            position: this.position,
            velocity: [0, 0],
        };
        this.body = new p2.Body(options);
        this.shape = new p2.Circle({
            radius: this.radius,
            collisionGroup: PLAYER,
            collisionMask: PLAYER | MAP_BORDER | BALL | GOAL_POST 
        });
        this.shape.material = this.material;
        this.body.addShape(this.shape);
        this.body.damping = 0.5;
    }

    private addMovementHandlers(): void {
        KeysHandler.add(Keys.Up, (pressed: boolean) => { if (pressed) this.movementKeysHandler(Keys.Up); });
        KeysHandler.add(Keys.Down, (pressed: boolean) => { if (pressed) this.movementKeysHandler(Keys.Down); });
        KeysHandler.add(Keys.Left, (pressed: boolean) => { if (pressed) this.movementKeysHandler(Keys.Left); });
        KeysHandler.add(Keys.Right, (pressed: boolean) => { if (pressed) this.movementKeysHandler(Keys.Right); });
        KeysHandler.add(Keys.Shift, (pressed: boolean) => { this.sprintKeyHandler(pressed); });
        KeysHandler.add(Keys.X, (pressed: boolean) => { this.shootingKeyHandler(pressed); });
    }

    private shootingKeyHandler(pressed: boolean): void {
        this.shooting = pressed;
    }

    private sprintKeyHandler(pressed: boolean): void {
        if (pressed) {
            this.movementSpeed = 4;
            this.maxSpeed = 45;
        } else {
            this.resetMovmentSpeed();
        }
    }

    private movementKeysHandler(key: Keys): void {
        if (key == Keys.Up) {
            this.body.velocity[1] -= this.movementSpeed;
        }
        if (key == Keys.Down) {
            this.body.velocity[1] += this.movementSpeed;
        }
        if (key == Keys.Left) {
            this.body.velocity[0] -= this.movementSpeed;
        }
        if (key == Keys.Right) {
            this.body.velocity[0] += this.movementSpeed;
        }

        const moveVector = { x: this.body.velocity[0], y: this.body.velocity[1] };
        const movmentLength = calculateVectorLength(moveVector);
        if (movmentLength > this.maxSpeed) {
            const normalizedMoveVector = normalizeVector(moveVector);
            this.body.velocity[0] = normalizedMoveVector.x * this.maxSpeed;
            this.body.velocity[1] = normalizedMoveVector.y * this.maxSpeed;
        }
    }

    private resetMovmentSpeed(): void {
        this.movementSpeed = 2;
        this.maxSpeed = 20;
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
        Canvas.ctx.strokeStyle = this.shooting ? 'white' : 'black';
        Canvas.ctx.lineWidth = 3;
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}