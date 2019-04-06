import { IPos, Shape } from './../utils/model';
import { Canvas } from './canvas';
import { ObjectBase } from "./objectBase";
import { EventManager } from './eventManager';

export class Bullet extends ObjectBase {
    public constructor(pos: IPos, moveVector: IPos) {
        super(pos, Shape.Circle, 6)
        this.moveVector = moveVector;
    }

    public logic() {
        this.pos.x += this.moveVector.x;
        this.pos.y += this.moveVector.y;

        if (this.moveVector.x || this.moveVector.y) {
            EventManager.notify('bullet::move', this);
        }
    }

    public render() {
        Canvas.ctx.save();
        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x, this.pos.y, this.size/2, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = 'black';
        Canvas.ctx.fill();
        Canvas.stopDraw();
        Canvas.ctx.restore();
    }
}