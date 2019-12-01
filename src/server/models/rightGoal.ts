import * as p2 from 'p2';

import { IPos } from './../../shared/model';
import { getCornerPoints } from './../../shared/vertices';
import { getOffset } from './../../shared/offset';
import { goal_config } from './../../shared/callibration';

import { GOAL, BALL, GOAL_POST, PLAYER } from '../../shared/collision';
import { goalMaterial, mapMaterial } from '../../shared/material';

export class RightGoal {
    private pos: IPos;

    public borderBody: p2.Body;
    public postBody: p2.Body;
    public scoreBody: p2.Body;

    private topPostShape: p2.Circle;
    private bottomPostShape: p2.Circle;

    public constructor(pos: IPos) {
        this.pos = { x: pos.x, y: pos.y };

        this.borderBody = new p2.Body({
            position: [this.pos.x, this.pos.y],
            mass: 0
        });
        this.borderBody.fromPolygon(this.getPoints());
        this.borderBody.shapes.forEach(shape => {
            shape.collisionGroup = GOAL;
            shape.collisionMask = BALL;
            shape.material = goalMaterial;
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
        this.topPostShape.material = mapMaterial;
        this.postBody.addShape(this.topPostShape, [0, 0]);

        this.bottomPostShape = new p2.Circle({
            radius: goal_config.postRadius,
            collisionGroup: GOAL_POST,
            collisionMask: PLAYER | BALL
        });
        this.bottomPostShape.material = mapMaterial;
        this.postBody.addShape(this.bottomPostShape, [0, goal_config.size.height]);
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