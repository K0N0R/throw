import * as p2 from 'p2';

import { IPos } from './../../shared/model';
import { getCornerPoints } from './../../shared/vertices';
import { getOffset } from './../../shared/offset';
import { goal_config, ball_config } from './../../shared/callibration';

import { GOAL, GOAL_SCORE, BALL, GOAL_POST, PLAYER } from './collision';

export class RightGoal {
    private pos: IPos;

    public borderBody: p2.Body;
    public postBody: p2.Body;
    public scoreBody: p2.Body;

    private topPostShape: p2.Circle;
    private bottomPostShape: p2.Circle;
    private scoreShape: p2.Box;

    public constructor(pos: IPos, material: p2.Material) {
        this.pos = { x: pos.x, y: pos.y };

        this.borderBody = new p2.Body({
            position: [this.pos.x, this.pos.y],
            mass: 0
        });
        this.borderBody.fromPolygon(this.getPoints());
        this.borderBody.shapes.forEach(shape => {
            shape.collisionGroup = GOAL;
            shape.collisionMask = BALL;
            shape.material = material;
        });

        this.postBody = new p2.Body({
            position: [this.pos.x, this.pos.y],
            mass: 0
        });
        this.topPostShape = new p2.Circle({
            radius: goal_config.postRadius,
            collisionGroup: GOAL_POST,
            collisionMask: PLAYER | BALL
        });
        this.topPostShape.material = material;
        this.postBody.addShape(this.topPostShape, [0, 0]);

        this.bottomPostShape = new p2.Circle({
            radius: goal_config.postRadius,
            collisionGroup: GOAL_POST,
            collisionMask: PLAYER | BALL
        });
        this.bottomPostShape.material = material;
        this.postBody.addShape(this.bottomPostShape, [0, goal_config.size.height]);

        this.scoreBody = new p2.Body({
            position: [this.pos.x + goal_config.size.width - ball_config.radius, this.pos.y],
            mass: 0.1
        });
        this.scoreShape = new p2.Box({
            width: goal_config.size.width - ball_config.radius,
            height: goal_config.size.height,
            collisionGroup: GOAL_SCORE,
            collisionMask: BALL
        });
        this.scoreBody.addShape(this.scoreShape, [(goal_config.size.width - ball_config.radius)/2, goal_config.size.height/2 ]);
    }

    private getPoints(pos = { x: 0, y: 0 }): ([number, number])[] {
        const offset = getOffset(pos, goal_config.size)
        const goalTickness = 10;
        return [
            [offset.left, offset.bottom],
            [offset.right - goal_config.cornerRadius, offset.bottom],
            ...getCornerPoints(goal_config.cornerPointsAmount, Math.PI / 2, { x: offset.right - goal_config.cornerRadius, y: offset.bottom - goal_config.cornerRadius }, goal_config.cornerRadius, -1),
            [offset.right, offset.bottom - goal_config.cornerRadius],
            [offset.right, offset.top + goal_config.cornerRadius],
            ...getCornerPoints(goal_config.cornerPointsAmount, 0, { x: offset.right - goal_config.cornerRadius, y: offset.top + goal_config.cornerRadius }, goal_config.cornerRadius, -1),
            [offset.right - goal_config.cornerRadius, offset.top],
            [offset.left, offset.top],
            [offset.left, offset.top - goalTickness],
            [offset.right + goalTickness, offset.top - goalTickness],
            [offset.right + goalTickness, offset.bottom + goalTickness],
            [offset.left, offset.bottom + goalTickness],
        ]
    }
}