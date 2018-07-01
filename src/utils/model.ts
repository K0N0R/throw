export interface IPos {
    x: number;
    y: number;
}

export interface ISize {
    width: number;
    height: number;
}

export enum Shape {
    Circle,
    Square
}

export interface IObservable<EventNameType> {
    eventName: EventNameType | string;
    action: Function;
}

export type Disposable = (() => void);