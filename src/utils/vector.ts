import { IPos } from './model';
export function nomalizeVector(posStart: IPos, posEnd: IPos): IPos {
    const vector = getVector(posStart, posEnd)
    const distance = getDistance(posStart, posEnd);
    const nomalizedVector: IPos = { x: vector.x / distance, y: vector.y / distance  };
    return nomalizedVector;
};

export function getDistance(posStart: IPos, posEnd: IPos): number {
    const vector = getVector(posStart, posEnd);
    const distance: number = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
    return distance;
}

export function getVector(posStart: IPos, posEnd: IPos): IPos {
    const vector: IPos = { x: posEnd.x - posStart.x, y: posEnd.y - posStart.y };
    return vector
}

export function clone(): any {
    var cloneObj = new (<any>this.constructor());
    for (var attribut in this) {
        if (typeof this[attribut] === "object") {
            cloneObj[attribut] = this.clone();
        } else {
            cloneObj[attribut] = this[attribut];
        }
    }
    return cloneObj;
}