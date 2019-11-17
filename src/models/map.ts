import * as p2 from 'p2';
import { Canvas } from './canvas';
import { ISize, Dictionary, IPos } from './../utils/model';
import { getOffset } from './../utils/offset';
import { PLAYER, MAP } from './collision';
import { getCornerPoints } from './../utils/vertices';
import { LeftGoal } from './leftGoal';
import { RightGoal } from './rightGoal.';


export class Map {
    public topBody: p2.Body;
    public botBody: p2.Body;

    public cornerRadius: number;
    public cornerPointsAmount: number;

    public goalSize: ISize;
    public leftGoal: LeftGoal;
    public rightGoal: RightGoal;

    public pos: IPos;
    public size: ISize;

    public constructor(material: p2.Material) {
        this.size = {
            height: 750,
            width: 1300
        };

        this.pos = {
            x: Canvas.size.width / 2 - this.size.width / 2,
            y: Canvas.size.height / 2 - this.size.height / 2
        }

        this.goalSize = {
            height: 150,
            width: 50
        };

        this.topBody = new p2.Body({
            mass: 0,
            position: [this.pos.x, this.pos.y]
        });
        
        this.cornerRadius = this.size.width / 15;
        this.cornerPointsAmount = 16;
        this.topBody.fromPolygon(this.getTopShapePoints());
        this.topBody.shapes.forEach(shape => {
            shape.material = material;
        });

        this.botBody = new p2.Body({
            mass: 0,
            position: [this.pos.x, this.pos.y]
        });
        this.botBody.fromPolygon(this.getBottomShapePoints());
        this.botBody.shapes.forEach(shape => {
            shape.material = material;
        });
        this.botBody.shapes.forEach(shape => {
            shape.material = material;
        });

        this.leftGoal = new LeftGoal(this.goalSize, [this.pos.x - this.goalSize.width, this.pos.y + this.size.height/2 - this.goalSize.height/2], material);
        this.rightGoal = new RightGoal(this.goalSize, [this.pos.x + this.size.width, this.pos.y + this.size.height/2 - this.goalSize.height/2], material);
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

    public render(): void {
        Canvas.ctx.save();
        Canvas.startDraw();

        Canvas.ctx.moveTo(this.pos.x, this.pos.y + this.size.height/2 - this.goalSize.height/2);
        const verticesTop = this.getTopShapePoints(this.pos);
        verticesTop.forEach(v => {
            Canvas.ctx.lineTo(v[0] , v[1]);
        });

        Canvas.ctx.lineWidth = 2;
        Canvas.ctx.strokeStyle = '#B7B9A0';
        Canvas.ctx.stroke();
        Canvas.ctx.fillStyle ='#e5e3c2';
        Canvas.stopDraw();

        Canvas.startDraw();

        Canvas.ctx.moveTo(this.pos.x + this.size.width, this.pos.y + this.size.height/2 - this.goalSize.height/2);
        const verticesBottom = this.getBottomShapePoints(this.pos);
        verticesBottom.forEach(v => {
            Canvas.ctx.lineTo(v[0] , v[1]);
        });

        Canvas.ctx.lineWidth = 2;
        Canvas.ctx.strokeStyle = '#B7B9A0';
        Canvas.ctx.stroke();
        Canvas.ctx.fillStyle ='#e5e3c2';
        Canvas.stopDraw();

        // Canvas.startDraw();
        // Canvas.ctx.moveTo(this.pos.x + this.cornerRadius, this.pos.y)
        // Canvas.ctx.lineTo(this.pos.x + this.size.width - this.cornerRadius, this.pos.y);
        // Canvas.ctx.arcTo(
        //     this.pos.x + this.size.width,
        //     this.pos.y,
        //     this.pos.x + this.size.width,
        //     this.pos.y + this.cornerRadius,
        //     this.cornerRadius);
        // Canvas.ctx.lineTo(this.pos.x + this.size.width, this.pos.y + this.size.height - this.cornerRadius);
        // Canvas.ctx.arcTo(
        //     this.pos.x + this.size.width,
        //     this.pos.y + this.size.height,
        //     this.pos.x + this.size.width - this.cornerRadius,
        //     this.pos.y + this.size.height,
        //     this.cornerRadius);
        // Canvas.ctx.lineTo(this.pos.x + this.cornerRadius, this.pos.y + this.size.height);
        // Canvas.ctx.arcTo(
        //     this.pos.x,
        //     this.pos.y + this.size.height,
        //     this.pos.x,
        //     this.pos.y + this.size.height - this.cornerRadius,
        //     this.cornerRadius);
        // Canvas.ctx.lineTo(this.pos.x, this.pos.y + this.cornerRadius);
        // Canvas.ctx.arcTo(
        //     this.pos.x,
        //     this.pos.y,
        //     this.pos.x + this.cornerRadius,
        //     this.pos.y,
        //     this.cornerRadius);
        // Canvas.ctx.lineWidth = 5;
        // Canvas.ctx.strokeStyle = '#B7B9A0';
        // Canvas.ctx.stroke();
        // Canvas.ctx.fillStyle ='#e5e3c2';
        // //Canvas.ctx.fill();
        // Canvas.stopDraw();
        // Canvas.ctx.restore();
        this.leftGoal.render();
        this.rightGoal.render();
    }
}