import * as p2 from 'p2';

import { getCornerPoints } from '../utils/vertices';
import { getOffset } from '../utils/offset';
import { IPos } from '../utils/model';
import { PLAYER, GOAL, BALL, GOAL_POST } from './collision';
import { goal } from './callibration';

export class LeftGoal {
    private pos: IPos;

    public borderBody: p2.Body;
    public postBody: p2.Body;

    private topPostShape: p2.Circle;
    private bottomPostShape: p2.Circle;

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
            radius: goal.postRadius,
            collisionGroup: GOAL_POST,
            collisionMask: PLAYER | BALL
        });
        this.topPostShape.material = material;
        this.postBody.addShape(this.topPostShape, [goal.size.width, 0]);

        this.bottomPostShape = new p2.Circle({
            radius: goal.postRadius,
            collisionGroup: GOAL_POST,
            collisionMask: PLAYER | BALL
        });
        this.bottomPostShape.material = material;
        this.postBody.addShape(this.bottomPostShape, [goal.size.width, goal.size.height]);
    }

    private getPoints(pos = { x: 0, y: 0 }): ([number, number])[] {
        const offset = getOffset(pos, goal.size)
        const goalTickness = 10;
        return [
            [offset.right, offset.bottom],
            [offset.left + goal.cornerRadius, offset.bottom],
            ...getCornerPoints(goal.cornerPointsAmount, Math.PI / 2, { x: offset.left + goal.cornerRadius, y: offset.bottom - goal.cornerRadius }, goal.cornerRadius),
            [offset.left, offset.bottom - goal.cornerRadius],
            [offset.left, offset.top + goal.cornerRadius],
            ...getCornerPoints(goal.cornerPointsAmount, Math.PI, { x: offset.left + goal.cornerRadius, y: offset.top + goal.cornerRadius }, goal.cornerRadius),
            [offset.left + goal.cornerRadius, offset.top],
            [offset.right, offset.top],
            [offset.right, offset.top - goalTickness],
            [offset.left - goalTickness, offset.top - goalTickness],
            [offset.left - goalTickness, offset.bottom + goalTickness],
            [offset.right, offset.bottom + goalTickness],
        ]
    }

    public logic(): void { }
}