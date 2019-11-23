import { ball_config, ball_style } from './../../shared/callibration';
import { IPos } from './../../shared/model';

import { Canvas } from './canvas';

export class Ball  {
    public pos: IPos;
    public constructor(pos: IPos) {
        this.pos = pos;
    }

    public render(): void {
        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x, this.pos.y, ball_config.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = ball_style.fillStyle;
        Canvas.ctx.fill();
        Canvas.ctx.strokeStyle = ball_style.strokeStyle;
        Canvas.ctx.lineWidth = ball_style.lineWidth;
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}