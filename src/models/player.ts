import * as p2 from 'p2';

import { Canvas } from './canvas';
import { KeysHandler, Keys } from './keysHandler';
import { MouseHandler, MouseClicks } from './mouseHandler';
import { calculateVectorLength, normalizeVector } from './../utils/vector';
import { IPos, Shape, } from './../utils/model';
import { EventManager } from './eventManager';
import { ObjectBase } from './objectBase';
import { MAP, PLAYER } from './collision';


export class Player  {
    public body: p2.Body;
    private shape: p2.Circle;

    public movementSpeed: number = 2;
    public maxSpeed: number = 40;
    private rotationAngle: number;
    public rotationVector: IPos;
    public crosshairDistance: number = 60;

    public constructor(position: [number, number], material: p2.Material ) {
        const radius = 30;
        const mass = 2;

        this.body = new p2.Body({
            mass: mass,
            position: position,
            velocity: [0, 0],
        });

        this.shape = new p2.Circle({
            radius: radius,
        });
        this.shape.material = material;
        this.body.addShape(this.shape);
        this.body.damping = 0.1;

        this.addMovementHandlers();
        this.addShootHandler();

    }

    private addMovementHandlers(): void {
        KeysHandler.add(Keys.W, () => { this.keysHandlers(Keys.W); });
        KeysHandler.add(Keys.S, () => { this.keysHandlers(Keys.S); });
        KeysHandler.add(Keys.A, () => { this.keysHandlers(Keys.A); });
        KeysHandler.add(Keys.D, () => { this.keysHandlers(Keys.D); });
        KeysHandler.add(Keys.Shift, () => { this.keysHandlers(Keys.Shift); });
    }

    private addShootHandler(): void {
        MouseHandler.add(MouseClicks.Left, () => {
            EventManager.notify('player::shoot', this);
        });
    }

    private keysHandlers(key: Keys) {
        if (key == Keys.W) {
            this.body.velocity[1] -= this.movementSpeed;
        }
        if (key == Keys.S) {
            this.body.velocity[1] += this.movementSpeed;
        }
        if (key == Keys.A) {
            this.body.velocity[0] -= this.movementSpeed;
        }
        if (key == Keys.D) {
            this.body.velocity[0] += this.movementSpeed;
        }
        if (key == Keys.Shift) {
            this.movementSpeed = 1;
            this.maxSpeed = 10;
        }
        else {
            this.movementSpeed = 5;
            this.maxSpeed = 40;
        }

        const moveVector = { x: this.body.velocity[0], y: this.body.velocity[1] };
        const movmentLength = calculateVectorLength(moveVector);
        if (movmentLength > this.maxSpeed) {
            const normalizedMoveVector = normalizeVector(moveVector);
            this.body.velocity[0] = normalizedMoveVector.x * this.maxSpeed;
            this.body.velocity[1] = normalizedMoveVector.y * this.maxSpeed;
        }
    }

    private movement() {
        if (this.body.velocity[0] || this.body.velocity[1]) {
            EventManager.notify('player::move', this);
        }

        const friction = 0.1;

        if (Math.abs(this.body.velocity[0]) > 0.06) {
            this.body.velocity[0] -= this.body.velocity[0] * friction;
        } else {
            this.body.velocity[0] = 0;
        }
        if (Math.abs(this.body.velocity[1]) > 0.06) {
            this.body.velocity[1] -= this.body.velocity[1] * friction;
        } else {
            this.body.velocity[1] = 0;
        }
    }

    public logic(): void {
        this.movement();
        //this.rotationVector = MouseHandler.getVectorToCursor(this.pos);
        //this.rotationAngle = Math.atan2(this.rotationVector.y, this.rotationVector.x);
    }

    public render(): void {
        Canvas.startDraw();
        Canvas.ctx.arc(this.body.position[0], this.body.position[1], this.shape.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = '#a7874d';
        Canvas.ctx.fill();
        Canvas.ctx.strokeStyle = '#7f4b34';
        Canvas.ctx.lineWidth = 5;
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        // Canvas.ctx.save();
        // Canvas.startDraw();
        // Canvas.ctx.translate(this.pos.x, this.pos.y);
        // Canvas.ctx.rotate(this.rotationAngle);
        // Canvas.ctx.arc(this.crosshairDistance, 0, 1, 0, 2 * Math.PI, true);
        // Canvas.ctx.fillStyle = 'black';
        // Canvas.ctx.fill();
        // Canvas.stopDraw();
        // Canvas.ctx.restore();
    }
}