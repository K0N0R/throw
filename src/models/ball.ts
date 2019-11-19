import * as p2 from 'p2';

import { Canvas } from './canvas';
import { BALL, MAP, GOAL, PLAYER, GOAL_POST } from './collision';

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
            collisionGroup: BALL,
            collisionMask: MAP | GOAL | PLAYER | GOAL_POST

        });

        this.shape.material = material;
        this.body.addShape(this.shape);
        this.body.damping = 0.1;
    }

    public logic(): void {}

    public render(): void {
        Canvas.startDraw();
        Canvas.ctx.arc(this.body.position[0], this.body.position[1], this.shape.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = '#FAFAFA';
        Canvas.ctx.fill();
        Canvas.ctx.strokeStyle = 'black';
        Canvas.ctx.lineWidth = 3;
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}