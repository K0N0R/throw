import * as p2 from 'p2';

import { IPos } from './../../shared/model';
import { getOffset } from './../../shared/offset';
import { getCornerPoints } from './../../shared/vertices';
import { map_config, goal_config, canvas_config } from './../../shared/callibration';

import { PLAYER, MAP, MAP_BORDER, BALL } from './collision';

export class Map {
    public pos: IPos;
    public outerPos: IPos;

    public topBody: p2.Body;
    public botBody: p2.Body;

    public borderBody: p2.Body;

    public constructor(material: p2.Material) {

        this.pos = {
            x: canvas_config.size.width / 2 - map_config.size.width / 2,
            y: canvas_config.size.height / 2 - map_config.size.height / 2
        };

        this.outerPos = {
            x: this.pos.x - map_config.border,
            y: this.pos.y - map_config.border
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
        const offset = getOffset(pos, map_config.size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.left, offset.midVert - goal_config.size.height / 2],
            [offset.left, offset.top + map_config.cornerRadius],
            ...getCornerPoints(map_config.cornerPointsAmount, Math.PI, { x: offset.left + map_config.cornerRadius, y: offset.top + map_config.cornerRadius }, map_config.cornerRadius),
            [offset.left + map_config.cornerRadius, offset.top],
            [offset.right - map_config.cornerRadius, offset.top],
            ...getCornerPoints(map_config.cornerPointsAmount, Math.PI + Math.PI / 2, { x: offset.right - map_config.cornerRadius, y: offset.top + map_config.cornerRadius }, map_config.cornerRadius),
            [offset.right, offset.top + map_config.cornerRadius],
            [offset.right, offset.midVert - goal_config.size.height / 2],

            [offset.right + mapTickness, offset.midVert - goal_config.size.height / 2], // obramówka zewnętrzna
            [offset.right + mapTickness, offset.top - mapTickness],
            [offset.left - mapTickness, offset.top - mapTickness],
            [offset.left - mapTickness, offset.midVert - goal_config.size.height / 2],
        ];
    }

    private getBottomShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, map_config.size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.right, offset.midVert + goal_config.size.height / 2],
            [offset.right, offset.bottom - map_config.cornerRadius],
            ...getCornerPoints(map_config.cornerPointsAmount, 0, { x: offset.right - map_config.cornerRadius, y: offset.bottom - map_config.cornerRadius }, map_config.cornerRadius),
            [offset.right - map_config.cornerRadius, offset.bottom],
            [offset.left + map_config.cornerRadius, offset.bottom],
            ...getCornerPoints(map_config.cornerPointsAmount, Math.PI / 2, { x: offset.left + map_config.cornerRadius, y: offset.bottom - map_config.cornerRadius }, map_config.cornerRadius),
            [offset.left, offset.bottom - map_config.cornerRadius],
            [offset.left, offset.midVert + goal_config.size.height / 2],

            [offset.left - mapTickness, offset.midVert + goal_config.size.height / 2],// obramówka zewnętrzna
            [offset.left - mapTickness, offset.bottom + mapTickness],
            [offset.right + mapTickness, offset.bottom + mapTickness],
            [offset.right + mapTickness, offset.midVert + goal_config.size.height / 2],
        ];
    }

    private getBorderShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, map_config.size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.left - map_config.border - mapTickness, offset.top - map_config.border], // top left corner
            [offset.right + map_config.border, offset.top - map_config.border], // top right corner
            [offset.right + map_config.border, offset.bottom + map_config.border], // bot right corner
            [offset.left - map_config.border, offset.bottom + map_config.border], // bot left corner
            [offset.left - map_config.border, offset.top - map_config.border + 1], // connector
            [offset.left - map_config.border - mapTickness, offset.top - map_config.border + 1], // connector outer
            [offset.left - map_config.border - mapTickness, offset.bottom + map_config.border + mapTickness], // bot left outer corner
            [offset.right + map_config.border + mapTickness, offset.bottom + map_config.border + mapTickness], // bot right outer corner
            [offset.right + map_config.border + mapTickness, offset.top - map_config.border - mapTickness], // top right outer corner
            [offset.left - map_config.border - mapTickness, offset.top - map_config.border - mapTickness], // top left outer corner
        ];
    }
}