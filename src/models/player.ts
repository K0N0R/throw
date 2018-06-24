import { Canvas } from './canvas';

export class Player {
    public constructor() {
    }

    public render() {
        Canvas.startDraw();
        Canvas.ctx.arc(500, 500, 20, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = 'green';
        Canvas.ctx.fill();
        Canvas.stopDraw();
    }
}
