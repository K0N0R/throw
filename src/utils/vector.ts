import { IPos } from './model';
export function getVector(posStart: IPos, posEnd: IPos): IPos {
    const vector: IPos = { x: posEnd.x - posStart.x, y: posEnd.y - posStart.y };
    return vector
}

export function getDistance(posStart: IPos, posEnd: IPos): number {
    const vector = getVector(posStart, posEnd);
    return calculateVectorLength(vector);
}

export function calculateVectorLength(vector: IPos): number {
    return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
}

export function getNormalizedVector(posStart: IPos, posEnd: IPos): IPos {
    const vector = getVector(posStart, posEnd)
    return normalizeVector(vector);
};

export function normalizeVector(vector: IPos): IPos {
    const distance = calculateVectorLength(vector);
    return { x: vector.x / distance, y: vector.y / distance  };
}