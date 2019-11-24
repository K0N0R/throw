import * as p2 from 'p2';

import { getCornerPoints } from './../../shared/vertices';
import { getOffset } from './../../shared/offset';
import { IPos } from './../../shared/model';
import { goal_config, ball_config } from './../../shared/callibration';

import { PLAYER, GOAL, GOAL_SCORE, BALL, GOAL_POST } from './collision';

export class LeftGoal {
    private pos: IPos;

    public borderBody: p2.Body;
    public postBody: p2.Body;
    public scoreBody: p2.Body;

    private topPostShape: p2.Circle;
    private bottomPostShape: p2.Circle;

    public constructor(pos: IPos, material: p2.Material, postMaterial: p2.Material) {
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
        this.topPostShape.material = postMaterial;
        this.postBody.addShape(this.topPostShape, [goal_config.size.width, 0]);

        this.bottomPostShape = new p2.Circle({
            radius: goal_config.postRadius,
            collisionGroup: GOAL_POST,
            collisionMask: PLAYER | BALL
        });
        this.bottomPostShape.material = postMaterial;
        this.postBody.addShape(this.bottomPostShape, [goal_config.size.width, goal_config.size.height]);
    }

    private getPoints(pos = { x: 0, y: 0 }): ([number, number])[] {
        const offset = getOffset(pos, goal_config.size)
        const goalTickness = 10;
        return [
            [offset.right, offset.bottom],
            [offset.left + goal_config.cornerRadius, offset.bottom],
            ...getCornerPoints(goal_config.cornerPointsAmount, Math.PI / 2, { x: offset.left + goal_config.cornerRadius, y: offset.bottom - goal_config.cornerRadius }, goal_config.cornerRadius),
            [offset.left, offset.bottom - goal_config.cornerRadius],
            [offset.left, offset.top + goal_config.cornerRadius],
            ...getCornerPoints(goal_config.cornerPointsAmount, Math.PI, { x: offset.left + goal_config.cornerRadius, y: offset.top + goal_config.cornerRadius }, goal_config.cornerRadius),
            [offset.left + goal_config.cornerRadius, offset.top],
            [offset.right, offset.top],
            [offset.right, offset.top - goalTickness],
            [offset.left - goalTickness, offset.top - goalTickness],
            [offset.left - goalTickness, offset.bottom + goalTickness],
            [offset.right, offset.bottom + goalTickness],
        ]
    }
}