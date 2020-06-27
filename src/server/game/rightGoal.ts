import * as p2 from 'p2';

import { IPos } from './../../shared/model';
import { getCornerPoints } from './../../shared/vertices';
import { getOffset } from './../../shared/offset';
import { map_config, MapKind } from './../../shared/callibration';

import { GOAL, BALL, GOAL_POST, PLAYER } from './collision';

export class RightGoal {
    private pos: IPos;

    public borderBody: p2.Body;
    public postBody: p2.Body;

    private topPostShape: p2.Circle;
    private bottomPostShape: p2.Circle;

    public constructor(private mapKind: MapKind, material: p2.Material, postMaterial: p2.Material) {
        this.pos = {
                x: map_config[this.mapKind].outerSize.width - map_config[this.mapKind].border,
                y: (map_config[this.mapKind].outerSize.height/2) - (map_config[this.mapKind].goal.size.height / 2)
            };

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
            radius: map_config[this.mapKind].goal.postRadius,
            collisionGroup: GOAL_POST,
            collisionMask: PLAYER | BALL
        });
        this.topPostShape.material = postMaterial;
        this.postBody.addShape(this.topPostShape, [0, 0]);

        this.bottomPostShape = new p2.Circle({
            radius: map_config[this.mapKind].goal.postRadius,
            collisionGroup: GOAL_POST,
            collisionMask: PLAYER | BALL
        });
        this.bottomPostShape.material = postMaterial;
        this.postBody.addShape(this.bottomPostShape, [0, map_config[this.mapKind].goal.size.height]);
    }

    private getPoints(pos = { x: 0, y: 0 }): ([number, number])[] {
        const offset = getOffset(pos, map_config[this.mapKind].goal.size)
        const goalTickness = 10;
        return [
            [offset.left, offset.bottom],
            [offset.right - map_config[this.mapKind].goal.cornerRadius, offset.bottom],
            ...getCornerPoints(map_config[this.mapKind].goal.cornerPointsAmount, Math.PI / 2, { x: offset.right - map_config[this.mapKind].goal.cornerRadius, y: offset.bottom - map_config[this.mapKind].goal.cornerRadius }, map_config[this.mapKind].goal.cornerRadius, {clockWise: -1}),
            [offset.right, offset.bottom - map_config[this.mapKind].goal.cornerRadius],
            [offset.right, offset.top + map_config[this.mapKind].goal.cornerRadius],
            ...getCornerPoints(map_config[this.mapKind].goal.cornerPointsAmount, 0, { x: offset.right - map_config[this.mapKind].goal.cornerRadius, y: offset.top + map_config[this.mapKind].goal.cornerRadius }, map_config[this.mapKind].goal.cornerRadius, {clockWise: -1}),
            [offset.right - map_config[this.mapKind].goal.cornerRadius, offset.top],
            [offset.left, offset.top],
            [offset.left, offset.top - goalTickness],
            [offset.right + goalTickness, offset.top - goalTickness],
            [offset.right + goalTickness, offset.bottom + goalTickness],
            [offset.left, offset.bottom + goalTickness],
        ]
    }
}