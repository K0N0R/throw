import { Canvas } from './canvas';
import { KeysHandler, Keys } from './keysHandler';
import { IPos } from './../utils/model';

export class Player {
    public pos: IPos;
    public radius: number = 20;
    private speed: number = 7;
    public constructor() {
        this.pos = {
            x: 100,
            y: 100
        };
        KeysHandler.add(Keys.W, this.moveTop.bind(this));
        KeysHandler.add(Keys.S, this.moveBottom.bind(this));
        KeysHandler.add(Keys.A, this.moveLeft.bind(this));
        KeysHandler.add(Keys.D, this.moveRight.bind(this));
    }

    public moveTop() {
        this.pos.y -= this.speed;
    }
    public moveBottom() {
        this.pos.y += this.speed;
    }
    public moveLeft() {
        this.pos.x -= this.speed;
    }
    public moveRight() {
        this.pos.x += this.speed;
    }

    public render() {
        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = 'green';
        Canvas.ctx.fill();
        Canvas.stopDraw();

        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x, this.pos.y, 1, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = 'black';
        Canvas.ctx.fill();
        Canvas.stopDraw();
    }
}
