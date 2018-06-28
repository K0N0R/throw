import { IPos } from './model';
export function nomalizeVector(posStart: IPos, posEnd: IPos): IPos {
    const vector: IPos = { x: posEnd.x - posStart.x, y: posEnd.y - posStart.y };
    const distance: number = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
    const nomalizedVector: IPos = { x: vector.x / distance, y: vector.y / distance  };
    return nomalizedVector;
};
