import { Canvas } from './canvas';
import { ball } from './callibration';
import { IPos } from './../utils/model';

export class Ball  {
    public pos: IPos;
    public constructor(pos: IPos) {
        this.pos = pos;
    }

    public render(): void {
        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x, this.pos.y, ball.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = '#FAFAFA';
        Canvas.ctx.fill();
        Canvas.ctx.strokeStyle = 'black';
        Canvas.ctx.lineWidth = 3;
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}