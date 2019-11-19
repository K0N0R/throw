import { IPos } from './../utils/model';
import { Canvas } from './canvas';

export class Camera {
    public static pos: IPos;

    public static updatePos(pos: IPos) {
        this.pos = {
            x: pos.x -  Canvas.size.width/2,
            y: pos.y - Canvas.size.height/2
        }
    }

    public static translateStart() {
        if (this.pos) {
            Canvas.ctx.save();
            Canvas.ctx.translate(-this.pos.x, -this.pos.y);
        }
    }

    public static translateEnd() {
        if (this.pos) {
            Canvas.ctx.restore()
        }
    }
}