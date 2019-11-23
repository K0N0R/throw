import * as p2 from 'p2';

import { ball } from './../../shared/callibration';

import { BALL, MAP, GOAL, PLAYER, GOAL_POST } from './collision';

export class Ball  {
    public body: p2.Body;
    private shape: p2.Circle;

    public constructor(position: [number, number], material: p2.Material ) {
        this.body = new p2.Body({
            mass: ball.mass,
            position: position,
        });

        this.shape = new p2.Circle({
            radius: ball.radius,
            collisionGroup: BALL,
            collisionMask: MAP | GOAL | PLAYER | GOAL_POST

        });

        this.shape.material = material;
        this.body.addShape(this.shape);
        this.body.damping = ball.damping;
    }
}