import { Canvas } from './canvas';
import { KeysHandler, Keys } from './keysHandler';
import { MouseHandler, MouseClicks } from './mouseHandler';
import { calculateVectorLength, normalizeVector} from './../utils/vector';
import { IPos, Shape,  } from './../utils/model';
import { EventManager } from './eventManager'; 
import { ObjectBase } from './objectBase';

export const PlayerSize = 30;

export class Player extends ObjectBase {
    private movementSpeed: number = 0.7;
    private maxSpeed: number = 6;
    private rotationAngle: number;
    public rotationVector: IPos;
    public crosshairDistance: number = 2 * PlayerSize;
    public constructor(pos: IPos) {
        super(pos, Shape.Circle, PlayerSize)
        this.addMovementHandlers();
        this.addShootHandler();

    }

    private addMovementHandlers(): void {
        KeysHandler.add(Keys.W, () => { this.keysHandlers(Keys.W); });
        KeysHandler.add(Keys.S, () => { this.keysHandlers(Keys.S); });
        KeysHandler.add(Keys.A, () => { this.keysHandlers(Keys.A); });
        KeysHandler.add(Keys.D, () => { this.keysHandlers(Keys.D); });
    }

    private addShootHandler(): void {
        MouseHandler.add(MouseClicks.Left, () => {
            EventManager.notify('player::shoot', this);
        });
    }

    private keysHandlers(key: Keys) {
        if(key == Keys.W) {
            this.moveVector.y = this.moveVector.y -= this.movementSpeed
        }
        if(key == Keys.S) {
            this.moveVector.y = this.moveVector.y += this.movementSpeed;
        }
        if (key == Keys.A) {
            this.moveVector.x = this.moveVector.x -= this.movementSpeed;
        }
        if(key == Keys.D) {
            this.moveVector.x = this.moveVector.x += this.movementSpeed;
        }
        if (key == Keys.Shift) {
        }
        const movmentLength = calculateVectorLength(this.moveVector);
        if (movmentLength > this.maxSpeed) {
            const normalizedMoveVector = normalizeVector(this.moveVector);
            this.moveVector.x = normalizedMoveVector.x * this.maxSpeed;
            this.moveVector.y = normalizedMoveVector.y * this.maxSpeed;
        }
    }

    private movement() {
        if (this.moveVector.x || this.moveVector.y) {
            EventManager.notify('player::move', this);
        }
        this.pos.x += this.moveVector.x;
        this.pos.y += this.moveVector.y;
        const friction = 0.25;
        
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
        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x, this.pos.y, this.shift, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = 'green';
        Canvas.ctx.fill();
        Canvas.stopDraw();

        Canvas.ctx.save();
        Canvas.startDraw();
        Canvas.ctx.translate(this.pos.x, this.pos.y);
        Canvas.ctx.rotate(this.rotationAngle);
        Canvas.ctx.arc(this.crosshairDistance, 0, 1, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = 'black';
        Canvas.ctx.fill();
        Canvas.stopDraw();
        Canvas.ctx.restore();
    }
}

