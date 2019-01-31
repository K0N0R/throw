import * as uuid from 'uuid';
import { IPos, Shape, IObservable, Disposable } from './../utils/model';

export class ObjectBase {
    public readonly uuid: string = uuid();
    public readonly shape: Shape;
    public readonly size: number;
    public readonly shift: number;
    public moveVector: IPos = { x: 0, y: 0};
    public pos: IPos;
    public constructor(pos: IPos, shape: Shape, size: number) {
        this.pos = pos;
        this.shape = shape;
        this.size = size;
        this.shift = this.size/2;
    }
    public color: string;
}

