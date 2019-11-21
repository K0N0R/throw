import { IPos, ISegment } from './model';
export function getVector(posStart: IPos, posEnd: IPos): IPos {
    const vector: IPos = { x: posEnd.x - posStart.x, y: posEnd.y - posStart.y };
    return vector
}

export function getDistance(posStart: IPos, posEnd: IPos): number {
    const vector = getVector(posStart, posEnd);
    return calculateVectorLength(vector);
}

export function getDistanceToSegment(segment: ISegment, point: IPos): number {
    const segVector = getVector(segment.start, segment.end);
    const segStartToPointVector = getVector(segment.start, point);
    const u = (segVector.x * segStartToPointVector.x + segVector.y * segStartToPointVector.y) / (Math.pow(segVector.x, 2) + Math.pow(segVector.y, 2));
    const p3 = { x: 0, y: 0};
    if (u <= 0) {
        p3.x = segment.start.x;
        p3.y = segment.start.y;
    } else if (u >= 1) {
        p3.x = segment.end.x;
        p3.y = segment.end.y;
    } else {
        p3.x = segment.start.x + u * segVector.x;
        p3.y = segment.start.y + u * segVector.y;
    }
    return Math.sqrt(Math.pow(point.x - p3.x, 2) + Math.pow(point.y - p3.y,2));
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