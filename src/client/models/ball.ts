import * as p2 from 'p2';

import { Canvas } from './canvas';

import { ball_config, ball_style } from './../../shared/callibration';
import { BALL, MAP, GOAL, PLAYER, GOAL_POST, GOAL_SCORE } from './../../shared/collision';
import { ballMaterial } from './../../shared/material';

export class Ball  {
    public body: p2.Body;
    private shape: p2.Circle;

    public constructor(position: [number, number]) {
        this.body = new p2.Body({
            mass: ball_config.mass,
            position: position,
        });

        this.shape = new p2.Circle({
            radius: ball_config.radius,
            collisionGroup: BALL,
            collisionMask: MAP | GOAL | PLAYER | GOAL_POST | GOAL_SCORE
        });

        this.shape.material = ballMaterial;
        this.body.addShape(this.shape);
        this.body.damping = ball_config.damping;
    }

    public render(): void {
        Canvas.startDraw();
        Canvas.ctx.arc(this.body.position[0], this.body.position[1], ball_config.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = ball_style.fillStyle;
        Canvas.ctx.fill();
        Canvas.ctx.strokeStyle = ball_style.strokeStyle;
        Canvas.ctx.lineWidth = ball_style.lineWidth;
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}