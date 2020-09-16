import { IPos, Shape } from '../utils/model';
import { Canvas } from './canvas';
import { ObjectBase } from './objectBase';
import { EventManager } from './eventManager';

export const CircleSize = 40;

export class Circle extends ObjectBase {
    public radius: number;
    public radiusResize: number;
    private minRadius: number;
    private maxRadius: number;
    public constructor(pos: IPos, color: string, moveVector: IPos) {
        super(pos, Shape.Circle, 5);
        this.minRadius = 5;
        this.maxRadius = 40;
        this.color = color;
        this.moveVector = moveVector;
    }

    private relativeRadiusResizeObject: ObjectBase = null;
    
    public removeEffect(object: ObjectBase): void {
        if (object.removed && this.relativeRadiusResizeObject === object) {
            this.relativeRadiusResizeObject = null;
        }
    }

    public grow(object: ObjectBase): void {
        this.radiusResize = 1;
        this.relativeRadiusResizeObject = object;
    }

    public fastGrow(object: ObjectBase): void {
        this.radiusResize = 1.5;
        this.relativeRadiusResizeObject = object;
    }

    public shrink(object: ObjectBase): void {
        if (!this.relativeRadiusResizeObject || this.relativeRadiusResizeObject === object) {
            this.radiusResize = -1;
        }       
    }

    public logic(): void {
        this.pos.x += this.moveVector.x;
        this.pos.y += this.moveVector.y;

        
        if (this.moveVector.x || this.moveVector.y) {
            EventManager.notify('circle::move', this);
        }

        if (this.radiusResize > 0) {
            if (this.radius >= this.maxRadius) {
                this.radiusResize = 0;
                this.radius = this.maxRadius;
            } else {
                this.radius += this.radiusResize;
            }
        } else if (this.radiusResize < 0) {
            if (this.radius <= this.minRadius) {
                this.radiusResize = 0;
                this.radius = this.minRadius;
                this.relativeRadiusResizeObject = null;
            } else {
                this.radius += this.radiusResize;
            }
        } 
    }

    public render(): void {
        Canvas.startDraw();
        Canvas.ctx.beginPath();
        Canvas.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
        Canvas.ctx.fillStyle = this.color;
        Canvas.ctx.fill();
        Canvas.stopDraw();
    }
}