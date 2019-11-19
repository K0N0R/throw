import * as p2 from 'p2';

import { Canvas } from './canvas';
import { ISize } from '../utils/model';
import { IPos } from '../utils/model';
import { getCornerPoints } from '../utils/vertices';
import { getOffset } from '../utils/offset';
import { GOAL, BALL, GOAL_POST, PLAYER } from './collision';

export class RightGoal {
    private size: ISize;
    private pos: IPos;
    private postRadius: number;
    private goalCornerRadius: number;

    public borderBody: p2.Body;

    public postBody: p2.Body;
    private topPostShape: p2.Circle;
    private bottomPostShape: p2.Circle;

    public constructor(size: ISize, pos: IPos, material: p2.Material) {
        this.size = size;
        this.postRadius = 15;
        this.goalCornerRadius = 30;
        this.pos = { x: pos.x, y: pos.y };

        const mass = 0;
        this.borderBody = new p2.Body({
            position: [this.pos.x, this.pos.y],
            mass: mass
        })

        this.borderBody.fromPolygon(this.getPoints());
        this.borderBody.shapes.forEach(shape => {
            shape.collisionGroup = GOAL;
            shape.collisionMask = BALL;
            shape.material = material;
        });

        this.postBody = new p2.Body({
            position: [this.pos.x, this.pos.y],
            mass: mass
        });
        this.topPostShape = new p2.Circle({
            radius: this.postRadius,
            collisionGroup: GOAL_POST,
            collisionMask: PLAYER | BALL
        });
        this.topPostShape.material = material;
        this.postBody.addShape(this.topPostShape, [0, 0]);

        this.bottomPostShape = new p2.Circle({
            radius: this.postRadius,
            collisionGroup: GOAL_POST,
            collisionMask: PLAYER | BALL
        });
        this.bottomPostShape.material = material;
        this.postBody.addShape(this.bottomPostShape, [0, this.size.height]);

    }

    private getPoints(pos = { x: 0, y: 0 }): ([number, number])[] {
        const cornerPointsAmount = 5;
        const offset = getOffset(pos, this.size)
        const goalTickness = 10;
        return [
            [offset.left, offset.bottom],
            [offset.right - this.goalCornerRadius, offset.bottom],
            ...getCornerPoints(cornerPointsAmount, Math.PI / 2, { x: offset.right - this.goalCornerRadius, y: offset.bottom - this.goalCornerRadius }, this.goalCornerRadius, -1),
            [offset.right, offset.bottom - this.goalCornerRadius],
            [offset.right, offset.top + this.goalCornerRadius],
            ...getCornerPoints(cornerPointsAmount, 0, { x: offset.right - this.goalCornerRadius, y: offset.top + this.goalCornerRadius }, this.goalCornerRadius, -1),
            [offset.right - this.goalCornerRadius, offset.top],
            [offset.left, offset.top],
            [offset.left, offset.top - goalTickness],
            [offset.right + goalTickness, offset.top - goalTickness],
            [offset.right + goalTickness, offset.bottom + goalTickness],
            [offset.left, offset.bottom + goalTickness],
        ]
    }

    public logic(): void { }

    public render(): void {
        Canvas.startDraw();
        const vertices = this.getPoints(this.pos);
        Canvas.ctx.moveTo(vertices[0][0], vertices[0][1]);
        vertices
            .filter((_, idx) => idx < vertices.length - 4) // skip 4 last
            .forEach(v => {
                Canvas.ctx.lineTo(v[0], v[1]);
            });
        Canvas.ctx.lineWidth = 3;
        Canvas.ctx.strokeStyle = 'white';
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        Canvas.startDraw();
        Canvas.ctx.lineWidth = 3;
        Canvas.ctx.arc(this.pos.x + this.topPostShape.position[0], this.pos.y + this.topPostShape.position[1], this.topPostShape.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.strokeStyle = 'black';
        Canvas.ctx.stroke();
        Canvas.ctx.fillStyle = 'red';
        Canvas.ctx.fill();
        Canvas.stopDraw();

        Canvas.startDraw();
        Canvas.ctx.lineWidth = 3;
        Canvas.ctx.arc(this.pos.x + this.bottomPostShape.position[0], this.pos.y + this.bottomPostShape.position[1], this.bottomPostShape.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.strokeStyle = 'black';
        Canvas.ctx.stroke();
        Canvas.ctx.fillStyle = 'red';
        Canvas.ctx.fill();
        Canvas.stopDraw();
    }
}