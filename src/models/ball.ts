import * as p2 from 'p2';

import { Canvas } from './canvas';
import { KeysHandler, Keys } from './keysHandler';
import { MouseHandler, MouseClicks } from './mouseHandler';
import { calculateVectorLength, normalizeVector } from './../utils/vector';
import { IPos, Shape, } from './../utils/model';
import { EventManager } from './eventManager';
import { ObjectBase } from './objectBase';
import { MAP, PLAYER } from './collision';


export class Ball  {
    public body: p2.Body;
    private shape: p2.Circle;

    public constructor(position: [number, number], material: p2.Material ) {
        const radius = 20;
        const mass = 1;

        this.body = new p2.Body({
            mass: mass,
            position: position,
        });

        this.shape = new p2.Circle({
            radius: radius,
        });

        this.shape.material = material;
        this.body.addShape(this.shape);
        this.body.damping = 0.1;
    }

    public logic(): void {
        //this.rotationVector = MouseHandler.getVectorToCursor(this.pos);
        //this.rotationAngle = Math.atan2(this.rotationVector.y, this.rotationVector.x);
    }

    public render(): void {
        Canvas.startDraw();
        Canvas.ctx.arc(this.body.position[0], this.body.position[1], this.shape.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = '#FAFAFA';
        Canvas.ctx.fill();
        Canvas.ctx.strokeStyle = '#333';
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