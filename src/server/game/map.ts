import p2 from 'p2';

import { IPos } from './../../shared/model';
import { getOffset } from './../../shared/offset';
import { getCornerPoints } from './../../shared/vertices';
import { map_config, style_config, MapKind } from './../../shared/callibration';

import { PLAYER, MAP, MAP_BORDER, BALL } from './collision';

export class Map {
    public pos: IPos;
    public outerPos: IPos;

    public topBody: p2.Body;
    public botBody: p2.Body;

    public borderBody: p2.Body;

    public leftHalfBody: p2.Body;
    public rightHalfBody: p2.Body;

    public constructor(private mapKind: MapKind, material: p2.Material) {

        this.pos = {
            x: map_config[this.mapKind].border.side,
            y: map_config[this.mapKind].border.upDown
        };

        this.outerPos = {
            x: 0,
            y: 0
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

        this.leftHalfBody = new p2.Body({
            mass: 0,
            position: [this.pos.x, this.pos.y]
        });
        this.leftHalfBody.fromPolygon(this.getLeftHalfBorderShapePoints());
        this.leftHalfBody.shapes.forEach(shape => {
            shape.material = material;
            shape.collisionGroup = MAP_BORDER;
            shape.collisionMask = PLAYER;
        });
        this.rightHalfBody = new p2.Body({
            mass: 0,
            position: [this.pos.x, this.pos.y]
        });
        this.rightHalfBody.fromPolygon(this.getRightHalfBorderShapePoints());
        this.rightHalfBody.shapes.forEach(shape => {
            shape.material = material;
            shape.collisionGroup = MAP_BORDER;
            shape.collisionMask = PLAYER;
        });
    }

    private getTopShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, map_config[this.mapKind].size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.left, offset.midVert - map_config[this.mapKind].goal.size.height / 2],
            [offset.left, offset.top + map_config[this.mapKind].cornerRadius],
            ...getCornerPoints(map_config[this.mapKind].cornerPointsAmount, Math.PI, { x: offset.left + map_config[this.mapKind].cornerRadius, y: offset.top + map_config[this.mapKind].cornerRadius }, map_config[this.mapKind].cornerRadius),
            [offset.left + map_config[this.mapKind].cornerRadius, offset.top],
            [offset.right - map_config[this.mapKind].cornerRadius, offset.top],
            ...getCornerPoints(map_config[this.mapKind].cornerPointsAmount, Math.PI + Math.PI / 2, { x: offset.right - map_config[this.mapKind].cornerRadius, y: offset.top + map_config[this.mapKind].cornerRadius }, map_config[this.mapKind].cornerRadius),
            [offset.right, offset.top + map_config[this.mapKind].cornerRadius],
            [offset.right, offset.midVert - map_config[this.mapKind].goal.size.height / 2],

            [offset.right + mapTickness, offset.midVert - map_config[this.mapKind].goal.size.height / 2], // obramówka zewnętrzna
            [offset.right + mapTickness, offset.top - mapTickness],
            [offset.left - mapTickness, offset.top - mapTickness],
            [offset.left - mapTickness, offset.midVert - map_config[this.mapKind].goal.size.height / 2],
        ];
    }

    private getBottomShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, map_config[this.mapKind].size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.right, offset.midVert + map_config[this.mapKind].goal.size.height / 2],
            [offset.right, offset.bottom - map_config[this.mapKind].cornerRadius],
            ...getCornerPoints(map_config[this.mapKind].cornerPointsAmount, 0, { x: offset.right - map_config[this.mapKind].cornerRadius, y: offset.bottom - map_config[this.mapKind].cornerRadius }, map_config[this.mapKind].cornerRadius),
            [offset.right - map_config[this.mapKind].cornerRadius, offset.bottom],
            [offset.left + map_config[this.mapKind].cornerRadius, offset.bottom],
            ...getCornerPoints(map_config[this.mapKind].cornerPointsAmount, Math.PI / 2, { x: offset.left + map_config[this.mapKind].cornerRadius, y: offset.bottom - map_config[this.mapKind].cornerRadius }, map_config[this.mapKind].cornerRadius),
            [offset.left, offset.bottom - map_config[this.mapKind].cornerRadius],
            [offset.left, offset.midVert + map_config[this.mapKind].goal.size.height / 2],

            [offset.left - mapTickness, offset.midVert + map_config[this.mapKind].goal.size.height / 2],// obramówka zewnętrzna
            [offset.left - mapTickness, offset.bottom + mapTickness],
            [offset.right + mapTickness, offset.bottom + mapTickness],
            [offset.right + mapTickness, offset.midVert + map_config[this.mapKind].goal.size.height / 2],
        ];
    }

    private getBorderShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, map_config[this.mapKind].size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.left - map_config[this.mapKind].border.side - mapTickness, offset.top - map_config[this.mapKind].border.upDown], // top left corner
            [offset.right + map_config[this.mapKind].border.side, offset.top - map_config[this.mapKind].border.upDown], // top right corner
            [offset.right + map_config[this.mapKind].border.side, offset.bottom + map_config[this.mapKind].border.upDown], // bot right corner
            [offset.left - map_config[this.mapKind].border.side, offset.bottom + map_config[this.mapKind].border.upDown], // bot left corner
            [offset.left - map_config[this.mapKind].border.side, offset.top - map_config[this.mapKind].border.upDown + 1], // connector
            [offset.left - map_config[this.mapKind].border.side - mapTickness, offset.top - map_config[this.mapKind].border.upDown + 1], // connector outer
            [offset.left - map_config[this.mapKind].border.side - mapTickness, offset.bottom + map_config[this.mapKind].border.upDown + mapTickness], // bot left outer corner
            [offset.right + map_config[this.mapKind].border.side + mapTickness, offset.bottom + map_config[this.mapKind].border.upDown + mapTickness], // bot right outer corner
            [offset.right + map_config[this.mapKind].border.side + mapTickness, offset.top - map_config[this.mapKind].border.upDown - mapTickness], // top right outer corner
            [offset.left - map_config[this.mapKind].border.side - mapTickness, offset.top - map_config[this.mapKind].border.upDown - mapTickness], // top left outer corner
        ];
    }

    private getLeftHalfBorderShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, map_config[this.mapKind].size); // convex use relative position to body
        const mapTickness = style_config.map.lineWidth;
        const absolute0 = -(map_config[this.mapKind].outerSize.height / 2 - map_config[this.mapKind].size.height / 2);
        return [
            [offset.midHori - mapTickness/2, absolute0], // top left corner
            [offset.midHori + mapTickness/2, absolute0], // top right corner
            [offset.midHori + mapTickness/2, offset.midVert - map_config[this.mapKind].middleRadius], // middle angle start
            ...getCornerPoints(map_config[this.mapKind].cornerPointsAmount * 2, -Math.PI/2, { x: offset.midHori, y: offset.midVert }, map_config[this.mapKind].middleRadius, { clockWise: -1, angleToTake: Math.PI }),
            [offset.midHori + mapTickness/2, offset.midVert + map_config[this.mapKind].middleRadius], // middle angle end
            [offset.midHori + mapTickness/2, map_config[this.mapKind].outerSize.height], // bottom right corner
            [offset.midHori - mapTickness/2, map_config[this.mapKind].outerSize.height], // bottom left corner
            // second layer
            [offset.midHori - mapTickness/2, offset.midVert + map_config[this.mapKind].middleRadius + mapTickness],
            ...getCornerPoints(map_config[this.mapKind].cornerPointsAmount * 2, Math.PI/2, { x: offset.midHori, y: offset.midVert }, map_config[this.mapKind].middleRadius + mapTickness, { clockWise: 1, angleToTake: Math.PI }),
            [offset.midHori - mapTickness/2, offset.midVert - map_config[this.mapKind].middleRadius - mapTickness],
        ]
    }

    private getRightHalfBorderShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, map_config[this.mapKind].size); // convex use relative position to body
        const mapTickness = style_config.map.lineWidth;
        const absolute0 = -(map_config[this.mapKind].outerSize.height / 2 - map_config[this.mapKind].size.height / 2);
        return [
            [offset.midHori + mapTickness/2, absolute0], // top right corner
            [offset.midHori - mapTickness/2, absolute0], // top left corner
            [offset.midHori - mapTickness/2, offset.midVert - map_config[this.mapKind].middleRadius], // middle angle start
            ...getCornerPoints(map_config[this.mapKind].cornerPointsAmount * 2, -Math.PI/2, { x: offset.midHori, y: offset.midVert }, map_config[this.mapKind].middleRadius, { clockWise: 1, angleToTake: Math.PI }),
            [offset.midHori - mapTickness/2, offset.midVert + map_config[this.mapKind].middleRadius], // middle angle end
            [offset.midHori - mapTickness/2, map_config[this.mapKind].outerSize.height], // bottom left corner
            [offset.midHori + mapTickness/2, map_config[this.mapKind].outerSize.height], // bottom left corner
            // second layer
            [offset.midHori + mapTickness/2, offset.midVert + map_config[this.mapKind].middleRadius + mapTickness],
            ...getCornerPoints(map_config[this.mapKind].cornerPointsAmount * 2, Math.PI/2, { x: offset.midHori, y: offset.midVert }, map_config[this.mapKind].middleRadius + mapTickness, { clockWise: -1, angleToTake: Math.PI }),
            [offset.midHori + mapTickness/2, offset.midVert - map_config[this.mapKind].middleRadius - mapTickness],
        ]
    }
}