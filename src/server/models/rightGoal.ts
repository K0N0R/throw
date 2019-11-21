import * as p2 from 'p2';

import { IPos } from '../utils/model';
import { getCornerPoints } from '../utils/vertices';
import { getOffset } from '../utils/offset';
import { GOAL, BALL, GOAL_POST, PLAYER } from './collision';
import { goal } from './callibration';

export class RightGoal {
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
        this.postBody.addShape(this.topPostShape, [0, 0]);

        this.bottomPostShape = new p2.Circle({
            radius: goal.postRadius,
            collisionGroup: GOAL_POST,
            collisionMask: PLAYER | BALL
        });
        this.bottomPostShape.material = material;
        this.postBody.addShape(this.bottomPostShape, [0, goal.size.height]);
    }

    private getPoints(pos = { x: 0, y: 0 }): ([number, number])[] {
        const offset = getOffset(pos, goal.size)
        const goalTickness = 10;
        return [
            [offset.left, offset.bottom],
            [offset.right - goal.cornerRadius, offset.bottom],
            ...getCornerPoints(goal.cornerPointsAmount, Math.PI / 2, { x: offset.right - goal.cornerRadius, y: offset.bottom - goal.cornerRadius }, goal.cornerRadius, -1),
            [offset.right, offset.bottom - goal.cornerRadius],
            [offset.right, offset.top + goal.cornerRadius],
            ...getCornerPoints(goal.cornerPointsAmount, 0, { x: offset.right - goal.cornerRadius, y: offset.top + goal.cornerRadius }, goal.cornerRadius, -1),
            [offset.right - goal.cornerRadius, offset.top],
            [offset.left, offset.top],
            [offset.left, offset.top - goalTickness],
            [offset.right + goalTickness, offset.top - goalTickness],
            [offset.right + goalTickness, offset.bottom + goalTickness],
            [offset.left, offset.bottom + goalTickness],
        ]
    }

    public logic(): void { }
}