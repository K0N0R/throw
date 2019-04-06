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

    public getPoints(): { top: IPos[], bottom: IPos[], left: IPos[], right: IPos[] } {
        const BRect = this.getBoundingRect();
        const friction = this.size / 20; // 10 is amount of points per side
        return {
            top: this.getPointsForSide(BRect.left, friction, { y: BRect.top }),
            left: this.getPointsForSide(BRect.top, friction, { x: BRect.left }),
            bottom: this.getPointsForSide(BRect.left, friction, { y: BRect.bottom }),
            right: this.getPointsForSide(BRect.top, friction, { x: BRect.right })
        }
    }

    private getPointsForSide(start: number, friction: number, constant: { x?: number; y?: number}): IPos[] {
        const points = [];
        for (let i = start; i <= start + this.size; i+=friction) {
            points.push({
                x: constant.x ? constant.x : i,
                y: constant.y ? constant.y : i,
            });
        }
        return points;
    }
}

