import * as p2 from 'p2';
import { Canvas } from './canvas';
import { ISize, IPos } from './../utils/model';
import { getOffset } from './../utils/offset';
import { PLAYER, MAP, MAP_BORDER, BALL } from './collision';
import { getCornerPoints } from './../utils/vertices';

export class Map {
    public pos: IPos;
    public outerPos: IPos;
    public size: ISize;
    public goalSize: ISize;
    public outerSize: ISize;

    public cornerRadius: number;
    public cornerPointsAmount: number;
    public borderDistance: number;

    public topBody: p2.Body;
    public botBody: p2.Body;

    public borderBody: p2.Body;

    public constructor(material: p2.Material, goalSize: ISize) {
        this.goalSize = goalSize;
        this.borderDistance = this.goalSize.width * 2;

        this.size = {
            height: 1000,
            width: 1600
        };
        this.pos = {
            x: Canvas.size.width / 2 - this.size.width / 2,
            y: Canvas.size.height / 2 - this.size.height / 2
        };

        this.outerSize = {
            height: this.size.height + this.borderDistance * 2,
            width: this.size.width + this.borderDistance * 2
        };

        this.outerPos = {
            x: this.pos.x - this.borderDistance,
            y: this.pos.y - this.borderDistance
        };

        this.cornerPointsAmount = 16;
        this.cornerRadius = this.size.width / 12;

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
        const cornerPointsAmount = 16;
        const offset = getOffset(pos, this.size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.left, offset.midVert - this.goalSize.height / 2],
            [offset.left, offset.top + this.cornerRadius],
            ...getCornerPoints(cornerPointsAmount, Math.PI, { x: offset.left + this.cornerRadius, y: offset.top + this.cornerRadius }, this.cornerRadius),
            [offset.left + this.cornerRadius, offset.top],
            [offset.right - this.cornerRadius, offset.top],
            ...getCornerPoints(cornerPointsAmount, Math.PI + Math.PI / 2, { x: offset.right - this.cornerRadius, y: offset.top + this.cornerRadius }, this.cornerRadius),
            [offset.right, offset.top + this.cornerRadius],
            [offset.right, offset.midVert - this.goalSize.height / 2],

            [offset.right + mapTickness, offset.midVert - this.goalSize.height / 2], // obramówka zewnętrzna
            [offset.right + mapTickness, offset.top - mapTickness],
            [offset.left - mapTickness, offset.top - mapTickness],
            [offset.left - mapTickness, offset.midVert - this.goalSize.height / 2],
        ];
    }

    private getBottomShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const cornerPointsAmount = 16;
        const offset = getOffset(pos, this.size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.right, offset.midVert + this.goalSize.height / 2],
            [offset.right, offset.bottom - this.cornerRadius],
            ...getCornerPoints(cornerPointsAmount, 0, { x: offset.right - this.cornerRadius, y: offset.bottom - this.cornerRadius }, this.cornerRadius),
            [offset.right - this.cornerRadius, offset.bottom],
            [offset.left + this.cornerRadius, offset.bottom],
            ...getCornerPoints(cornerPointsAmount, Math.PI / 2, { x: offset.left + this.cornerRadius, y: offset.bottom - this.cornerRadius }, this.cornerRadius),
            [offset.left, offset.bottom - this.cornerRadius],
            [offset.left, offset.midVert + this.goalSize.height / 2],

            [offset.left - mapTickness, offset.midVert + this.goalSize.height / 2],// obramówka zewnętrzna
            [offset.left - mapTickness, offset.bottom + mapTickness],
            [offset.right + mapTickness, offset.bottom + mapTickness],
            [offset.right + mapTickness, offset.midVert + this.goalSize.height / 2],
        ];
    }

    private getBorderShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, this.size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.left - this.borderDistance - mapTickness, offset.top - this.borderDistance], // top left corner
            [offset.right + this.borderDistance, offset.top - this.borderDistance], // top right corner
            [offset.right + this.borderDistance, offset.bottom + this.borderDistance], // bot right corner
            [offset.left - this.borderDistance, offset.bottom + this.borderDistance], // bot left corner
            [offset.left - this.borderDistance, offset.top - this.borderDistance + 1], // connector
            [offset.left - this.borderDistance - mapTickness, offset.top - this.borderDistance + 1], // connector outer
            [offset.left - this.borderDistance - mapTickness, offset.bottom + this.borderDistance + mapTickness], // bot left outer corner
            [offset.right + this.borderDistance + mapTickness, offset.bottom + this.borderDistance + mapTickness], // bot right outer corner
            [offset.right + this.borderDistance + mapTickness, offset.top - this.borderDistance - mapTickness], // top right outer corner
            [offset.left - this.borderDistance - mapTickness, offset.top - this.borderDistance - mapTickness], // top left outer corner
        ];
    }

    public logic(): void { }

    public render(): void {
        Canvas.startDraw();
        const verticesTop = this.getTopShapePoints(this.pos);
        Canvas.ctx.moveTo(verticesTop[0][0], verticesTop[0][1]);
        verticesTop
            .filter((_, idx) => idx < verticesTop.length - 4) // skip 4 last
            .forEach(v => {
                Canvas.ctx.lineTo(v[0], v[1]);
            });
        Canvas.ctx.lineWidth = 3;
        Canvas.ctx.strokeStyle = 'white';
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        Canvas.startDraw();
        const verticesBottom = this.getBottomShapePoints(this.pos);
        Canvas.ctx.moveTo(verticesBottom[0][0], verticesBottom[0][1]);
        verticesBottom
            .filter((_, idx) => idx < verticesBottom.length - 4) // skip 4 last
            .forEach(v => {
                Canvas.ctx.lineTo(v[0], v[1]);
            });
        Canvas.ctx.lineWidth = 3;
        Canvas.ctx.strokeStyle = 'white';
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        Canvas.startDraw();
        const verticesBorder = this.getBorderShapePoints(this.pos);
        Canvas.ctx.moveTo(verticesBorder[0][0], verticesBorder[0][1]);
        verticesBorder
            .forEach(v => {
                Canvas.ctx.lineTo(v[0], v[1]);
            });
        Canvas.ctx.fillStyle = '#222';
        Canvas.ctx.fill();
        Canvas.stopDraw();
    }
}