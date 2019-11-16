import * as p2 from 'p2';
import { Canvas } from './canvas';
import { ISize, Dictionary, IPos } from './../utils/model';
import { PLAYER, MAP } from './collision';


export class Map {
    public body: p2.Body;
    public cornersShape: p2.Convex;
    public cornerRadius: number;
    public topShape: p2.Box;
    public bottomShape: p2.Box;
    public leftShape: p2.Box;
    public rightShape: p2.Box;
    public borderThick: number;
    public size: ISize;

    private color: 'green';

    public constructor(material: p2.Material) {
        this.size = {
            height: 750,
            width: 1300
        };

        this.body = new p2.Body({
            mass: 0,
            position: [Canvas.size.width / 2 - this.size.width / 2, Canvas.size.height / 2 - this.size.height / 2]
        });

        this.cornerRadius = this.size.width / 15;
        this.cornersShape = new p2.Convex({
            vertices: this.getCornerPoints(),
        });
        this.cornersShape.material = material;
        this.body.addShape(this.cornersShape);
        
        this.borderThick = 5;
        this.topShape = new p2.Box({
            width: this.size.width - 2*this.cornerRadius,
            height: this.borderThick
        });
        this.topShape.material = material;
        this.body.addShape(this.topShape, [this.cornerRadius + this.topShape.width/2, -this.borderThick/2]);

        this.bottomShape = new p2.Box({
            width: this.size.width - 2*this.cornerRadius,
            height: this.borderThick
        });
        this.bottomShape.material = material;
        this.body.addShape(this.bottomShape, [this.cornerRadius + this.bottomShape.width/2, this.size.height+this.borderThick/2]);

        this.leftShape = new p2.Box({
            width: this.borderThick,
            height: this.size.height - this.cornerRadius*2
        });
        this.leftShape.material = material;
        this.body.addShape(this.leftShape, [-this.borderThick/2, this.cornerRadius + this.leftShape.height/2]);

        this.rightShape = new p2.Box({
            width: this.borderThick,
            height: this.size.height - this.cornerRadius*2
        });
        this.rightShape.material = material;
        this.body.addShape(this.rightShape, [this.size.width + this.borderThick/2, this.cornerRadius + this.rightShape.height/2]);
    }

    private getCornerPoints(pos = { x: 0, y: 0 }, render = false): any {
        const cornerPointsAmmount = 16;
        const cornerPI = Math.PI / 2 / cornerPointsAmmount;
        const getCornerPoints = (pos: IPos, angle: number): ([number, number])[] => {
            const cornerPoints: ([number, number])[] = [];
            for (let i = 1; i <= cornerPointsAmmount - 1; i++) {
                cornerPoints.push(
                    [this.cornerRadius * Math.cos(angle + cornerPI * i) + pos.x, this.cornerRadius * Math.sin(angle + cornerPI * i) + pos.y]
                )

            }
            return cornerPoints;
        }

        return [
            [pos.x, pos.y + this.cornerRadius],
            ...getCornerPoints({ x: pos.x + this.cornerRadius, y: pos.y + this.cornerRadius }, Math.PI),
            [pos.x + this.cornerRadius, pos.y], [pos.x + this.size.width - this.cornerRadius, pos.y],
            ...getCornerPoints({ x: pos.x + this.size.width - this.cornerRadius, y: pos.y + this.cornerRadius }, Math.PI + Math.PI / 2),
            [pos.x + this.size.width, pos.y + this.cornerRadius], [pos.x + this.size.width, pos.y + this.size.height - this.cornerRadius],
            ...getCornerPoints({ x: pos.x + this.size.width - this.cornerRadius, y: pos.y + this.size.height - this.cornerRadius }, 0),
            [pos.x + this.size.width - this.cornerRadius, pos.y + this.size.height], [pos.x + this.cornerRadius, pos.y + this.size.height],
            ...getCornerPoints({ x: pos.x + this.cornerRadius, y: pos.y + this.size.height - this.cornerRadius }, Math.PI / 2),
            [pos.x, pos.y + this.size.height - this.cornerRadius],
            [pos.x, pos.y + this.cornerRadius]
        ];
    }

    public render(): void {
        const pos = {
            x: this.body.position[0],
            y: this.body.position[1]
        };
        Canvas.ctx.save();
        Canvas.startDraw();

        Canvas.ctx.moveTo(pos.x + this.cornerRadius, pos.y);
        Canvas.ctx.lineTo(pos.x + this.size.width - this.cornerRadius, pos.y);
        Canvas.ctx.arcTo(
            pos.x + this.size.width,
            pos.y,
            pos.x + this.size.width,
            pos.y + this.cornerRadius,
            this.cornerRadius);
        Canvas.ctx.lineTo(pos.x + this.size.width, pos.y + this.size.height - this.cornerRadius);
        Canvas.ctx.arcTo(
            pos.x + this.size.width,
            pos.y + this.size.height,
            pos.x + this.size.width - this.cornerRadius,
            pos.y + this.size.height,
            this.cornerRadius);
        Canvas.ctx.lineTo(pos.x + this.cornerRadius, pos.y + this.size.height);
        Canvas.ctx.arcTo(
            pos.x,
            pos.y + this.size.height,
            pos.x,
            pos.y + this.size.height - this.cornerRadius,
            this.cornerRadius);
        Canvas.ctx.lineTo(pos.x, pos.y + this.cornerRadius);
        Canvas.ctx.arcTo(
            pos.x,
            pos.y,
            pos.x + this.cornerRadius,
            pos.y,
            this.cornerRadius);
        Canvas.ctx.lineWidth = 2;
        Canvas.ctx.strokeStyle = '#B7B9A0';
        Canvas.ctx.stroke();
        Canvas.ctx.fillStyle ='#e5e3c2';
        Canvas.ctx.fill();
        Canvas.stopDraw();
        Canvas.ctx.restore();
    }
}