import * as p2 from 'p2';

import { IPos } from './../../shared/model';
import { getOffset } from './../../shared/offset';
import { getCornerPoints } from './../../shared/vertices';
import { map, goal, canvas } from './../../shared/callibration';

import { PLAYER, MAP, MAP_BORDER, BALL } from './collision';

export class Map {
    public pos: IPos;
    public outerPos: IPos;

    public topBody: p2.Body;
    public botBody: p2.Body;

    public borderBody: p2.Body;

    public constructor(material: p2.Material) {

        this.pos = {
            x: canvas.size.width / 2 - map.size.width / 2,
            y: canvas.size.height / 2 - map.size.height / 2
        };

        this.outerPos = {
            x: this.pos.x - map.border,
            y: this.pos.y - map.border
        };

        this.topBody = new p2.Body({
            mass: 0,
            position: [this.pos.x, this.pos.y]
        });

        this.topBody.fromPolygon(this.getTopShapePoints());
        this.topBody.shapes.forEach(shape => {
            shape.material = material;
            shape.collisionGroup = MAP;
            shape.collisionMask = BALL;
        });

        this.botBody = new p2.Body({
            mass: 0,
            position: [this.pos.x, this.pos.y]
        });
        this.botBody.fromPolygon(this.getBottomShapePoints());
        this.botBody.shapes.forEach(shape => {
            shape.material = material;
            shape.collisionGroup = MAP;
            shape.collisionMask = BALL;
        });

        this.borderBody = new p2.Body({
            mass: 0,
            position: [this.pos.x, this.pos.y]
        });
        this.borderBody.fromPolygon(this.getBorderShapePoints());
        this.borderBody.shapes.forEach(shape => {
            shape.material = material;
            shape.collisionGroup = MAP_BORDER;
            shape.collisionMask = PLAYER;
        });
    }

    private getTopShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, map.size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.left, offset.midVert - goal.size.height / 2],
            [offset.left, offset.top + map.cornerRadius],
            ...getCornerPoints(map.cornerPointsAmount, Math.PI, { x: offset.left + map.cornerRadius, y: offset.top + map.cornerRadius }, map.cornerRadius),
            [offset.left + map.cornerRadius, offset.top],
            [offset.right - map.cornerRadius, offset.top],
            ...getCornerPoints(map.cornerPointsAmount, Math.PI + Math.PI / 2, { x: offset.right - map.cornerRadius, y: offset.top + map.cornerRadius }, map.cornerRadius),
            [offset.right, offset.top + map.cornerRadius],
            [offset.right, offset.midVert - goal.size.height / 2],

            [offset.right + mapTickness, offset.midVert - goal.size.height / 2], // obramówka zewnętrzna
            [offset.right + mapTickness, offset.top - mapTickness],
            [offset.left - mapTickness, offset.top - mapTickness],
            [offset.left - mapTickness, offset.midVert - goal.size.height / 2],
        ];
    }

    private getBottomShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, map.size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.right, offset.midVert + goal.size.height / 2],
            [offset.right, offset.bottom - map.cornerRadius],
            ...getCornerPoints(map.cornerPointsAmount, 0, { x: offset.right - map.cornerRadius, y: offset.bottom - map.cornerRadius }, map.cornerRadius),
            [offset.right - map.cornerRadius, offset.bottom],
            [offset.left + map.cornerRadius, offset.bottom],
            ...getCornerPoints(map.cornerPointsAmount, Math.PI / 2, { x: offset.left + map.cornerRadius, y: offset.bottom - map.cornerRadius }, map.cornerRadius),
            [offset.left, offset.bottom - map.cornerRadius],
            [offset.left, offset.midVert + goal.size.height / 2],

            [offset.left - mapTickness, offset.midVert + goal.size.height / 2],// obramówka zewnętrzna
            [offset.left - mapTickness, offset.bottom + mapTickness],
            [offset.right + mapTickness, offset.bottom + mapTickness],
            [offset.right + mapTickness, offset.midVert + goal.size.height / 2],
        ];
    }

    private getBorderShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, map.size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.left - map.border - mapTickness, offset.top - map.border], // top left corner
            [offset.right + map.border, offset.top - map.border], // top right corner
            [offset.right + map.border, offset.bottom + map.border], // bot right corner
            [offset.left - map.border, offset.bottom + map.border], // bot left corner
            [offset.left - map.border, offset.top - map.border + 1], // connector
            [offset.left - map.border - mapTickness, offset.top - map.border + 1], // connector outer
            [offset.left - map.border - mapTickness, offset.bottom + map.border + mapTickness], // bot left outer corner
            [offset.right + map.border + mapTickness, offset.bottom + map.border + mapTickness], // bot right outer corner
            [offset.right + map.border + mapTickness, offset.top - map.border - mapTickness], // top right outer corner
            [offset.left - map.border - mapTickness, offset.top - map.border - mapTickness], // top left outer corner
        ];
    }
}