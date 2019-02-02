import * as uuid from 'uuid';
import { IPos, Shape, IBoundingRect } from './../utils/model';

export class ObjectBase {
    public readonly uuid: string = uuid();
    public readonly shape: Shape;
    public readonly size: number;
    public readonly radius: number;
    public moveVector: IPos = { x: 0, y: 0};
    public pos: IPos;
    public constructor(pos: IPos, shape: Shape, size: number) {
        this.pos = pos;
        this.shape = shape;
        this.size = size;
        this.radius = this.size/2;
    }
    public color: string;

    public getBoundingRect(): IBoundingRect {
        return {
            left: this.pos.x - this.radius,
            right: this.pos.x + this.radius,
            top: this.pos.y - this.radius,
            bottom: this.pos.y + this.radius,
            width: this.size,
            height: this.size
        }
    }

    public getAngles() {
        return {
            topLeft: { x: this.pos.x - this.radius, y: this.pos.y - this.radius },
            topRight: { x: this.pos.x + this.radius, y: this.pos.y - this.radius },
            bottomLeft: { x: this.pos.x - this.radius, y: this.pos.y + this.radius },
            bottomRight: { x: this.pos.x + this.radius, y: this.pos.y + this.radius }
        }
    }
}

