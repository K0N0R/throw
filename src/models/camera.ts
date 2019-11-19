import { IPos } from './../utils/model';
import { Canvas } from './canvas';
import { IOffset } from './../utils/offset';

export class Camera {
    private static offset: IOffset;
    public static pos: IPos;

    public static setBounduary(offset: IOffset): void {
        this.offset = offset;
    }

    public static updatePos(pos: IPos) {
        const newPos = {
            x: pos.x -  Canvas.size.width/2,
            y: pos.y - Canvas.size.height/2
        };
        if (newPos.x < this.offset.left) {
            newPos.x = this.offset.left;
        }
        if (newPos.x > this.offset.right - Canvas.size.width) {
            newPos.x = this.offset.right - Canvas.size.width;
        }
        if (newPos.y < this.offset.top) {
            newPos.y = this.offset.top;
        }
        if (newPos.y > this.offset.bottom - Canvas.size.height) {
            newPos.y = this.offset.bottom - Canvas.size.height;
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