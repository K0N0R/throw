import { IPos } from './../utils/model';
import { Canvas } from './canvas';
import { IOffset } from './../utils/offset';
import { canvas } from './callibration';

export class Camera {
    private static offset: IOffset;
    public static pos: IPos;

    public static setBounduary(offset: IOffset): void {
        this.offset = offset;
    }

    public static updatePos(pos: IPos) {
        const newPos = {
            x: pos.x -  canvas.size.width/2,
            y: pos.y - canvas.size.height/2
        };
        if (newPos.x < this.offset.left) {
            newPos.x = this.offset.left;
        }
        if (newPos.x > this.offset.right - canvas.size.width) {
            newPos.x = this.offset.right - canvas.size.width;
        }
        if (newPos.y < this.offset.top) {
            newPos.y = this.offset.top;
        }
        if (newPos.y > this.offset.bottom - canvas.size.height) {
            newPos.y = this.offset.bottom - canvas.size.height;
        }
        this.pos = newPos;
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