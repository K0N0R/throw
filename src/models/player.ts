import { Canvas } from './canvas';
import { KeysHandler, Keys } from './keysHandler';
import { MouseHandler } from './mouseHandler';
import { nomalizeVector, clone } from './../utils/vector';
import { IPos, Shape, IObservable, Disposable } from './../utils/model';
import { Assets } from './assets';
import { ObjectBase } from './objectBase';

type events = 'move' | 'shoot';

export const PlayerSize = 30;

export class Player extends ObjectBase {
    private movementSpeed: number = 3.4;
    private rotationAngle: number;
    private rotationVector: IPos;
    private observables: IObservable<events>[] = [];
    public constructor(pos: IPos) {
        super(pos, Shape.Circle, PlayerSize)
        this.addMovementHandlers();
    }

    private addMovementHandlers(): void {
        KeysHandler.add(Keys.W, () => { this.keysHandlers(Keys.W); });
        KeysHandler.add(Keys.S, () => { this.keysHandlers(Keys.S); });
        KeysHandler.add(Keys.A, () => { this.keysHandlers(Keys.A); });
        KeysHandler.add(Keys.D, () => { this.keysHandlers(Keys.D); });
    }

    public onPositionChanged(callback: Function): Disposable {
        const observable = { action: callback, eventName: 'move' };
        this.observables.push(observable);
        return () => {
            const idx = this.observables.indexOf(observable);
            if (idx != -1) {
                this.observables.splice(idx, 1);
            }
        };
    }

    public positionChangedActions(oldPos: IPos) {
        const positionChanged = this.observables.filter((o) => o.eventName === 'move' );
        positionChanged.forEach(o => o.action(this, oldPos));
    }

    private keysHandlers(key: Keys) {
        if(key == Keys.W) {
            this.moveVector.y = -this.movementSpeed;
        }
        if(key == Keys.S) {
            this.moveVector.y = this.movementSpeed;
        }
        if (key == Keys.A) {
            this.moveVector.x = -this.movementSpeed;
        }
        if(key == Keys.D) {
            this.moveVector.x = this.movementSpeed;
        }
        if (key == Keys.Shift) {
        }
        
    }

    private movement() {
        const old = { x: this.pos.x, y: this.pos.y };
        this.pos.x += this.moveVector.x;
        this.pos.y += this.moveVector.y;
        const friction = 0.08;

        if (this.moveVector.x || this.moveVector.y) {
            this.positionChangedActions(old);
        }
        
        if (Math.abs(this.moveVector.x) > 0.06) {
            this.moveVector.x -= this.moveVector.x * friction;        
        } else {
            this.moveVector.x = 0;
        }
        if (Math.abs(this.moveVector.y) > 0.06) {
            this.moveVector.y -= this.moveVector.y * friction;
        } else {
            this.moveVector.y = 0; 
        }
    }

    public logic(): void {
        this.movement();
        this.rotationVector = MouseHandler.getVectorToCursor(this.pos);
        this.rotationAngle = Math.atan2(this.rotationVector.y, this.rotationVector.x);
    }

    public render(): void {
        Canvas.ctx.save();
        Canvas.startDraw();
        Canvas.ctx.translate(this.pos.x, this.pos.y);
        Canvas.ctx.rotate(this.rotationAngle);
        Canvas.ctx.arc(0, 0, this.size/2, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = 'green';
        Canvas.ctx.fill();
        Canvas.stopDraw();
        Canvas.ctx.restore();

        Canvas.ctx.save();
        Canvas.startDraw();
        Canvas.ctx.translate(this.pos.x, this.pos.y);
        Canvas.ctx.rotate(this.rotationAngle);
        Canvas.ctx.arc(2* this.size, 0, 1, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = 'black';
        Canvas.ctx.fill();
        Canvas.stopDraw();
        Canvas.ctx.restore();
    }
}

