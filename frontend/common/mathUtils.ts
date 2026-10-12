export interface IPosition {
    x: number;
    y: number;
}

export namespace MathUtils {
    export function distance(a: IPosition, b: IPosition) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    export function manhatanDisatance(a: IPosition, b: IPosition) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    export function getVector(a: IPosition, b: IPosition) {
        return {
            x: a.x - b.x,
            y: a.y - b.y,
        };
    }

    export function invertVector(v: IPosition) {
        return { x: -v.x, y: -v.y };
    }

    export function normalise(v: IPosition) {
        const vLength = distance(v, { x: 0, y: 0 });
        if (vLength === 0) return { x: 0, y: 0 };
        return {
            x: v.x / vLength,
            y: v.y / vLength,
        };
    }

    export function getVectorFromRotation(rotation: number) {
        return {
            x: Math.cos(rotation),
            y: Math.sin(rotation),
        };
    }

    export function vectorRotation(a: IPosition, b: IPosition) {
        const v = getVector(a, b);

        return Math.atan2(v.y, v.x) - Math.PI / 2;
    }
    export function rotationFromVector(v: IPosition) {
        return Math.atan2(v.y, v.x) - Math.PI / 2;
    }

    export function getRandomValueFromRange(min: number, max: number, rng = Math.random) {
        const delta = max - min;

        return min + delta * rng();
    }

    export function getRandomIntegerFromRange(min: number, max: number, rng = Math.random) {
        return Math.round(
            getRandomValueFromRange(min - 0.5 + Number.EPSILON, max + 0.5 - Number.EPSILON, rng),
        );
    }

    export function getRandomArrayItem<T>(array: T[] | ReadonlyArray<T>, rng = Math.random): T {
        const randomIdx = Math.round(getRandomIntegerFromRange(0, array.length - 1, rng));
        return array[randomIdx];
    }

    export function minMax(value: number, min: number, max: number): number {
        return Math.max(Math.min(value, max), min);
    }

    export function randomVector(length: number): IPosition {
        const alpha = MathUtils.getRandomValueFromRange(0, Math.PI * 2);
        return { x: Math.sin(alpha) * length, y: Math.cos(alpha) * length };
    }

    export function getRandomPositionAroundAnchor(
        anchor: IPosition,
        minDistance: number,
        maxDistance: number,
    ) {
        const angle = MathUtils.getRandomValueFromRange(0, Math.PI * 2);
        const vector = MathUtils.normalise({ x: Math.cos(angle), y: Math.sin(angle) });
        const distance = MathUtils.getRandomValueFromRange(minDistance, maxDistance);

        return {
            x: anchor.x + vector.x * distance,
            y: anchor.y + vector.y * distance,
        };
    }

    export function getRandomPositionsInCone(
        baseAngle: number,
        anchor: IPosition,
        minDistance: number,
        maxDistance: number,
    ): IPosition {
        const angleDispertion = MathUtils.getRandomValueFromRange(
            (-1 / 8) * Math.PI,
            (1 / 8) * Math.PI,
        );
        const vector = MathUtils.normalise({
            x: Math.cos(baseAngle + angleDispertion),
            y: Math.sin(baseAngle + angleDispertion),
        });
        const distance = MathUtils.getRandomValueFromRange(minDistance, maxDistance);
        return {
            x: anchor.x + vector.x * distance,
            y: anchor.y + vector.y * distance,
        };
    }

    export function areSameArrays(array1: string[], array2: string[]) {
        if (array1.length !== array2.length) {
            return false;
        }

        const sortedArr1 = [...array1].sort();
        const sortedArr2 = [...array2].sort();

        for (let i = 0; i < sortedArr1.length; i++) {
            if (sortedArr1[i] !== sortedArr2[i]) {
                return false;
            }
        }
        return true;
    }

    export function prettyRound(value: number) {
        return Math.round(value * 100) / 100;
    }
}
