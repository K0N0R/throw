import * as uuid from 'uuid';
import { IPos, Shape, IObservable, Disposable } from './../utils/model';

export class ObjectBase<TEventName = string> {
    private observables: IObservable<TEventName>[] = [];
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

    public observe(eventName: TEventName, callback: Function): Disposable {
        const observable = { action: callback, eventName: eventName };
        this.observables.push(observable);
        return () => {
            const idx = this.observables.indexOf(observable);
            if (idx != -1) {
                this.observables.splice(idx, 1);
            }
        };
    }

    public notify(eventName: TEventName, args?: any): void {
        const positionChanged = this.observables.filter((o) => o.eventName === eventName );
        positionChanged.forEach(o => o.action(this, args));
    }
}

