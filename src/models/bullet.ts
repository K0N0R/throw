import { IPos, Shape, IObservable, Disposable } from './../utils/model';
import { Canvas } from './canvas';
import { ObjectBase } from "./objectBase";

type events = 'move';

export class Bullet extends ObjectBase<events> {
    public constructor(pos: IPos, moveVector: IPos) {
        super(pos, Shape.Circle, 2)
        this.moveVector = moveVector;
    }

    public logic() {
        const old = { x: this.pos.x, y: this.pos.y };
        this.pos.x += this.moveVector.x;
        this.pos.y += this.moveVector.y;

        if (this.moveVector.x || this.moveVector.y) {
            this.notify('move', old);
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