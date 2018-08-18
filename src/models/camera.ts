import { IPos } from './../utils/model';
import { Canvas } from './canvas';
export class Camera {
    private static pos: IPos;

    public static updatePos(pos: IPos): void {
        this.pos = pos;
    }

    public static logic() {
        if (this.pos) {
            Canvas.ctx.save();
            Canvas.ctx.translate(-this.pos.x + Canvas.width/2, -this.pos.y + Canvas.height/2);
        }
    }
}