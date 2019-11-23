import { IPos } from './../../shared/model';
import { getCornerPoints } from './../../shared/vertices';
import { getOffset } from './../../shared/offset';
import { goal_config } from './../../shared/callibration';

import { Canvas } from './canvas';

export class RightGoal {
    private pos: IPos;
    private topPostPosition: IPos;
    private bottomPostPosition: IPos;

    public constructor(pos: IPos) {
        this.pos = { x: pos.x, y: pos.y };
        this.topPostPosition = { x: this.pos.x, y: this.pos.y };
        this.bottomPostPosition = { x: this.pos.x, y: this.pos.y + goal_config.size.height };
    }

    private getPoints(pos = { x: 0, y: 0 }): ([number, number])[] {
        const offset = getOffset(pos, goal_config.size)
        const goalTickness = 10;
        return [
            [offset.left, offset.bottom],
            [offset.right - goal_config.cornerRadius, offset.bottom],
            ...getCornerPoints(goal_config.cornerPointsAmount, Math.PI / 2, { x: offset.right - goal_config.cornerRadius, y: offset.bottom - goal_config.cornerRadius }, goal_config.cornerRadius, -1),
            [offset.right, offset.bottom - goal_config.cornerRadius],
            [offset.right, offset.top + goal_config.cornerRadius],
            ...getCornerPoints(goal_config.cornerPointsAmount, 0, { x: offset.right - goal_config.cornerRadius, y: offset.top + goal_config.cornerRadius }, goal_config.cornerRadius, -1),
            [offset.right - goal_config.cornerRadius, offset.top],
            [offset.left, offset.top],
            [offset.left, offset.top - goalTickness],
            [offset.right + goalTickness, offset.top - goalTickness],
            [offset.right + goalTickness, offset.bottom + goalTickness],
            [offset.left, offset.bottom + goalTickness],
        ]
    }

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
        Canvas.ctx.arc(this.topPostPosition.x, this.topPostPosition.y, goal_config.postRadius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = '#D95A62';
        Canvas.ctx.fill();
        Canvas.ctx.lineWidth = 3;
        Canvas.ctx.strokeStyle = 'black';
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        Canvas.startDraw();
        Canvas.ctx.arc(this.bottomPostPosition.x, this.bottomPostPosition.y, goal_config.postRadius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = '#D95A62';
        Canvas.ctx.fill();
        Canvas.ctx.lineWidth = 3;
        Canvas.ctx.strokeStyle = 'black';
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}