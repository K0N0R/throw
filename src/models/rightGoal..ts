import * as p2 from 'p2';

import { Canvas } from './canvas';
import { ISize } from '../utils/model';
import { IPos } from '../utils/model';
import { getCornerPoints } from '../utils/vertices';
import { getOffset } from '../utils/offset';
import { GOAL, BALL } from './collision';

export class RightGoal  {
    public body: p2.Body;
    private size: ISize;
    private pos: IPos;
    private postRadius: number;
    private topPostShape: p2.Circle;
    private bottomPostShape: p2.Circle;

    private gateCornerRadius: number;

    public constructor(size: ISize, position: [number, number], material: p2.Material ) {
        const mass = 0;
        this.pos = { x:position[0], y: position[1]};
        this.body = new p2.Body({
            position: [this.pos.x, this.pos.y],
            mass: mass
        })

        this.size = size;
        this.postRadius = 6;
        this.gateCornerRadius = 30;
        this.body.fromPolygon(this.getPoints());
        this.body.shapes.forEach(shape => {
            shape.collisionGroup = GOAL;
            shape.collisionMask = BALL;
            shape.material = material;
        });
        this.topPostShape = new p2.Circle({
            radius: this.postRadius,
        });
        this.topPostShape.material = material;
        //this.body.addShape(this.topPostShape, [position[0] + this.size.width, position[1]]);

        this.bottomPostShape = new p2.Circle({
            radius: this.postRadius,
        });
        this.bottomPostShape.material = material;
        //this.body.addShape(this.bottomPostShape, [position[0] +this.size.width, position[1] + this.size.height]);

    }

    private getPoints(pos = { x: 0, y: 0 }): ([number, number])[] {
        const cornerPointsAmount = 5;
        const offset = getOffset(pos, this.size)
        const goalTickness = 10;
        return [
            [offset.right + goalTickness, offset.bottom + goalTickness],
            [offset.left, offset.bottom + goalTickness],
            [offset.left, offset.bottom],
            [offset.right - this.gateCornerRadius, offset.bottom],
            ...getCornerPoints(cornerPointsAmount, Math.PI/2, { x: offset.right - this.gateCornerRadius, y: offset.bottom - this.gateCornerRadius }, this.gateCornerRadius, -1),
            [offset.right, offset.bottom - this.gateCornerRadius],
            [offset.right, offset.top + this.gateCornerRadius],
            ...getCornerPoints(cornerPointsAmount, 0, { x: offset.right - this.gateCornerRadius, y: offset.top + this.gateCornerRadius }, this.gateCornerRadius, -1),
            [offset.right - this.gateCornerRadius, offset.top],
            [offset.left, offset.top],
            [offset.left, offset.top - goalTickness],
            [offset.right + goalTickness, offset.top - goalTickness],
        ]
    }

    public logic(): void {}

    public render(): void {
        Canvas.startDraw();
        Canvas.ctx.arc(this.topPostShape.position[0], this.topPostShape.position[1], this.topPostShape.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.strokeStyle = '#FAFAFA';
        Canvas.ctx.stroke();
        Canvas.stopDraw();
        
        Canvas.startDraw();
        Canvas.ctx.arc(this.bottomPostShape.position[0], this.bottomPostShape.position[1], this.bottomPostShape.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.strokeStyle = '#FAFAFA';
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        Canvas.startDraw();
        Canvas.ctx.moveTo(this.pos.x + this.size.width + 10, this.pos.y + this.size.height + 10);
        const vertices = this.getPoints(this.pos);
        vertices.forEach(v => {
            Canvas.ctx.lineTo(v[0] , v[1]);
        });
        Canvas.ctx.lineWidth = 1;
        Canvas.ctx.strokeStyle = '#FAFAFA';
        Canvas.ctx.stroke();
        Canvas.ctx.fillStyle = '#FAFAFA';
        Canvas.ctx.fill();
        Canvas.stopDraw();
    }
}