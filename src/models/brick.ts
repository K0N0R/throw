import { IPos, ISize, Shape } from './../utils/model';
import { Canvas } from './canvas';
import { ObjectBase } from './objectBase';

export const BrickSize = 20;

export class Brick extends ObjectBase {

    public constructor(pos: IPos) {
        super(pos, Shape.Square, BrickSize);
        this.color = 'white'
    }

    public render(): void {
        const boundingRect = this.getBoundingRect();
        Canvas.startDraw();
        Canvas.ctx.rect(boundingRect.left, boundingRect.top, this.size, this.size);
        Canvas.ctx.fillStyle = this.color;
        Canvas.ctx.fill();
        Canvas.ctx.lineWidth = 1;
        Canvas.ctx.strokeStyle = 'black';
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}