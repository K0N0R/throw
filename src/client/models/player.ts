import { Canvas } from './canvas';
import { player } from './callibration';
import { IPos } from './../utils/model';

export class Player {
    public socketId: string;
    public pos: IPos;
    public color: string;

    public shootingStrong!: boolean;
    public shootingWeak!: boolean;

    public constructor(pos: IPos, socketId: string, color: string) {
        this.pos = pos;
        this.socketId = socketId;
        this.color = color;
    }

    public render(): void {
        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x, this.pos.y, player.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = this.color;
        Canvas.ctx.fill();
        Canvas.ctx.strokeStyle = this.shootingStrong || this.shootingWeak ? 'white' : 'black';
        Canvas.ctx.lineWidth = 3;
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}