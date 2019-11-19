import * as p2 from 'p2';
import { Canvas } from './canvas';
import { ISize, IPos } from './../utils/model';
import { getOffset } from './../utils/offset';
import { PLAYER, MAP, MAP_BORDER, BALL } from './collision';
import { getCornerPoints } from './../utils/vertices';

export class Map {
    public pos: IPos;
    public size: ISize;
    public goalSize: ISize;
    public cornerRadius: number;
    public cornerPointsAmount: number;

    public topBody: p2.Body;
    public botBody: p2.Body;

    public borderBody: p2.Body;

    public constructor(material: p2.Material, goalSize: ISize) {
        this.size = {
            height: 750,
            width: 1300
        };
        this.goalSize = goalSize;

        this.cornerRadius = this.size.width / 10;
        this.cornerPointsAmount = 16;

        this.pos = {
            x: Canvas.size.width / 2 - this.size.width / 2,
            y: Canvas.size.height / 2 - this.size.height / 2
        }

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
            [offset.left, offset.midVert - this.goalSize.height/2],
            [offset.left, offset.top + this.cornerRadius],
            ...getCornerPoints(cornerPointsAmount, Math.PI, { x: offset.left + this.cornerRadius, y: offset.top + this.cornerRadius }, this.cornerRadius),
            [offset.left + this.cornerRadius, offset.top],
            [offset.right - this.cornerRadius, offset.top],
            ...getCornerPoints(cornerPointsAmount, Math.PI + Math.PI / 2, { x: offset.right - this.cornerRadius, y: offset.top + this.cornerRadius }, this.cornerRadius),
            [offset.right, offset.top + this.cornerRadius],
            [offset.right, offset.midVert - this.goalSize.height/2],
             
            [offset.right + mapTickness, offset.midVert - this.goalSize.height/2], // obramówka zewnętrzna
            [offset.right + mapTickness, offset.top - mapTickness],
            [offset.left - mapTickness, offset.top - mapTickness],
            [offset.left - mapTickness, offset.midVert - this.goalSize.height/2],
        ];
    }

    private getBottomShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const cornerPointsAmount = 16;
        const offset = getOffset(pos, this.size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.right, offset.midVert + this.goalSize.height/2],
            [offset.right, offset.bottom - this.cornerRadius],
            ...getCornerPoints(cornerPointsAmount, 0, { x: offset.right - this.cornerRadius, y: offset.bottom - this.cornerRadius }, this.cornerRadius),
            [offset.right - this.cornerRadius, offset.bottom],
            [offset.left + this.cornerRadius, offset.bottom],
            ...getCornerPoints(cornerPointsAmount, Math.PI / 2, { x: offset.left + this.cornerRadius, y: offset.bottom - this.cornerRadius }, this.cornerRadius),
            [offset.left, offset.bottom - this.cornerRadius],
            [offset.left, offset.midVert + this.goalSize.height/2],

            [offset.left - mapTickness, offset.midVert + this.goalSize.height/2],// obramówka zewnętrzna
            [offset.left - mapTickness, offset.bottom + mapTickness],
            [offset.right + mapTickness, offset.bottom + mapTickness],
            [offset.right + mapTickness, offset.midVert + this.goalSize.height/2],
        ];
    }

    private getBorderShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, this.size); // convex use relative position to body
        const mapTickness = 10;
        const borderDistance = this.goalSize.width* 2;
        return [
            [offset.left - borderDistance - mapTickness, offset.top - borderDistance], // top left corner
            [offset.right + borderDistance, offset.top - borderDistance], // top right corner
            [offset.right + borderDistance, offset.bottom + borderDistance], // bot right corner
            [offset.left - borderDistance, offset.bottom + borderDistance], // bot left corner
            [offset.left - borderDistance, offset.top - borderDistance + 1], // connector
            [offset.left - borderDistance - mapTickness, offset.top - borderDistance + 1], // connector outer
            [offset.left - borderDistance - mapTickness, offset.bottom + borderDistance + mapTickness], // bot left outer corner
            [offset.right + borderDistance + mapTickness, offset.bottom + borderDistance + mapTickness], // bot right outer corner
            [offset.right + borderDistance + mapTickness, offset.top - borderDistance - mapTickness], // top right outer corner
            [offset.left - borderDistance - mapTickness, offset.top - borderDistance - mapTickness], // top left outer corner
        ];
    }

    public logic(): void {}

    public render(): void {
        Canvas.startDraw();
        const verticesTop = this.getTopShapePoints(this.pos);
        Canvas.ctx.moveTo(verticesTop[0][0], verticesTop[0][1]);
        verticesTop.forEach(v => {
            Canvas.ctx.lineTo(v[0] , v[1]);
        });
        Canvas.ctx.lineWidth = 2;
        Canvas.ctx.strokeStyle = '#B7B9A0';
        Canvas.ctx.stroke();
        Canvas.ctx.fillStyle ='#e5e3c2';
        Canvas.ctx.fill();
        Canvas.stopDraw();

        Canvas.startDraw();
        const verticesBottom = this.getBottomShapePoints(this.pos);
        Canvas.ctx.moveTo(verticesBottom[0][0], verticesBottom[0][1]);
        verticesBottom.forEach(v => {
            Canvas.ctx.lineTo(v[0] , v[1]);
        });
        Canvas.ctx.lineWidth = 2;
        Canvas.ctx.strokeStyle = '#B7B9A0';
        Canvas.ctx.stroke();
        Canvas.ctx.fillStyle ='#e5e3c2';
        Canvas.ctx.fill();
        Canvas.stopDraw();

        Canvas.startDraw();
        const verticesBorder = this.getBorderShapePoints(this.pos);
        Canvas.ctx.moveTo(verticesBorder[0][0], verticesBorder[0][1]);
        verticesBorder.forEach(v => {
            Canvas.ctx.lineTo(v[0] , v[1]);
        });
        Canvas.ctx.lineWidth = 2;
        Canvas.ctx.strokeStyle = '#B7B9A0';
        Canvas.ctx.stroke();
        Canvas.ctx.fillStyle ='#a7874d';
        Canvas.ctx.fill();
        Canvas.stopDraw();
    }
}