import * as p2 from 'p2';

import { getCornerPoints } from './../../shared/vertices';
import { getOffset } from './../../shared/offset';
import { IPos } from './../../shared/model';
import { map_config, MapKind } from './../../shared/callibration';

import { PLAYER, GOAL, BALL, GOAL_POST } from './collision';

export class LeftGoal {
    private pos: IPos;

    public borderBody: p2.Body;
    public postBody: p2.Body;

    private topPostShape: p2.Circle;
    private bottomPostShape: p2.Circle;

    public constructor(private mapKind: MapKind, material: p2.Material, postMaterial: p2.Material) {
        this.pos = {
            x: map_config[this.mapKind].border - map_config[this.mapKind].goal.size.width,
            y: (map_config[this.mapKind].outerSize.height / 2) - (map_config[this.mapKind].goal.size.height / 2)
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
        this.postBody.addShape(this.topPostShape, [map_config[this.mapKind].goal.size.width, 0]);

        this.bottomPostShape = new p2.Circle({
            radius: map_config[this.mapKind].goal.postRadius,
            collisionGroup: GOAL_POST,
            collisionMask: PLAYER | BALL
        });
        this.bottomPostShape.material = postMaterial;
        this.postBody.addShape(this.bottomPostShape, [map_config[this.mapKind].goal.size.width, map_config[this.mapKind].goal.size.height]);
    }

    private getPoints(pos = { x: 0, y: 0 }): ([number, number])[] {
        const offset = getOffset(pos, map_config[this.mapKind].goal.size)
        const goalTickness = 10;
        return [
            [offset.right, offset.bottom],
            [offset.left + map_config[this.mapKind].goal.cornerRadius, offset.bottom],
            ...getCornerPoints(map_config[this.mapKind].goal.cornerPointsAmount, Math.PI / 2, { x: offset.left + map_config[this.mapKind].goal.cornerRadius, y: offset.bottom - map_config[this.mapKind].goal.cornerRadius }, map_config[this.mapKind].goal.cornerRadius),
            [offset.left, offset.bottom - map_config[this.mapKind].goal.cornerRadius],
            [offset.left, offset.top + map_config[this.mapKind].goal.cornerRadius],
            ...getCornerPoints(map_config[this.mapKind].goal.cornerPointsAmount, Math.PI, { x: offset.left + map_config[this.mapKind].goal.cornerRadius, y: offset.top + map_config[this.mapKind].goal.cornerRadius }, map_config[this.mapKind].goal.cornerRadius),
            [offset.left + map_config[this.mapKind].goal.cornerRadius, offset.top],
            [offset.right, offset.top],
            [offset.right, offset.top - goalTickness],
            [offset.left - goalTickness, offset.top - goalTickness],
            [offset.left - goalTickness, offset.bottom + goalTickness],
            [offset.right, offset.bottom + goalTickness],
        ]
    }
}