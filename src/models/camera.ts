import { IPos } from './../utils/model';
import { Canvas } from './canvas';
export class Camera {
    private static _pos: IPos;
    public static get pos(): IPos {
        return this._pos;
    };

    public static set pos(pos: IPos) {
        this._pos = {
            x: pos.x -  Canvas.width/2,
            y: pos.y - Canvas.height/2
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