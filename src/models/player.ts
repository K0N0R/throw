import { Canvas } from './canvas';
import { KeysHandler, Keys } from './keysHandler';
import { MouseHandler } from './mouseHandler';
import { nomalizeVector } from './../utils/vector';
import { IPos } from './../utils/model';
import { Assets } from './assets';

export class Player {
    public pos: IPos;
    public radius: number = 50;
    private speed: number = 7;
    private rotationAngle: number;
    private rotationVector: IPos;
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

    public logic() {

        this.rotationVector = MouseHandler.getVectorToCursor(this.pos);
        this.rotationAngle = Math.atan2(this.rotationVector.y, this.rotationVector.x);
    }

    public render() {
        Canvas.ctx.save();
        Canvas.startDraw();
        Canvas.ctx.translate(this.pos.x, this.pos.y);
        Canvas.ctx.rotate(this.rotationAngle);
        Canvas.ctx.drawImage(Assets.getAsset('player_model'), -50, -50);
        Canvas.stopDraw();
        Canvas.ctx.restore();

        Canvas.ctx.save();
        Canvas.startDraw();
        Canvas.ctx.translate(this.pos.x, this.pos.y);
        Canvas.ctx.rotate(this.rotationAngle);
        Canvas.ctx.arc(2* this.radius, 0, 1, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = 'black';
        Canvas.ctx.fill();
        Canvas.stopDraw();
        Canvas.ctx.restore();
    }
}

