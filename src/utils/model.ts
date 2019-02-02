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

export interface IBoundingRect {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
}

export type Disposable = (() => void);