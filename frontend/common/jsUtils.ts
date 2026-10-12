import { IPosition } from './mathUtils';

export interface IPromise {
    promise: Promise<unknown>;
    resolve: () => void;
    reject: () => void;
}

export namespace JsUtils {
    export function noop() {}

    export function isValidNumber(value: unknown): value is number {
        return typeof value === 'number' && !isNaN(value);
    }

    export function createArray<T>(length: number, creator: (index: number) => T): T[] {
        const array = [] as T[];

        for (let i = 0; i < length; i++) {
            array.push(creator(i));
        }
        return array;
    }

    export function create2DArray<T>(size: number, fill: T): T[][] {
        const result = [] as T[][];

        for (let y = 0; y < size; y++) {
            result.push([]);
            for (let x = 0; x < size; x++) {
                result[y][x] = fill;
            }
        }
        return result;
    }

    export function createPromise(): IPromise {
        let resolveMe: (value?: unknown) => void = noop;
        let rejectMe: (value?: unknown) => void = noop;

        const promise = new Promise<unknown>((resolve, reject) => {
            resolveMe = resolve;
            rejectMe = reject;
        });

        return {
            promise,
            resolve: resolveMe,
            reject: rejectMe,
        };
    }

    export function sleep(ms: number) {
        return new Promise((resole) => {
            setTimeout(resole, ms);
        });
    }

    export function capitalizeFirstLetter(string: string): string {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    export function iso(position: IPosition, negative: boolean = false) {
        return {
            x: position.x,
            y: position.y + position.x * (Math.tan(Math.PI / 6) * (negative ? -1 : 1)),
        };
    }

    export function cancelableTimeout(delayMS: number, action: () => unknown) {
        const id = setTimeout(action, delayMS);

        return {
            cancel: () => clearTimeout(id),
        };
    }

    export function checkAndTellOggSupport(document: Document) {
        var audio = document.createElement('audio');
        var canPlay = audio.canPlayType('audio/ogg; codecs="vorbis"');

        if (canPlay === 'probably') {
            console.log('This browser probably supports .ogg audio format.');
            return true;
        } else if (canPlay === 'maybe') {
            console.log('This browser might support .ogg audio format.');
            return true;
        } else {
            console.log('This browser does not support .ogg audio format.');
            return false;
        }
    }

    export function removeElementFromArray<T>(array: T[], element: T): T | void {
        const index = array.indexOf(element);
        let removedElement: T | undefined;
        if (index !== -1) {
            removedElement = array.splice(index, 1).pop();
        }

        return removedElement;
    }
}
