import * as PIXI from 'pixi.js';
import { IPromise } from '@common';

export class BasePopup<TData> extends PIXI.Container {
    promise!: IPromise;

    show(data: TData) {}

    createBaseComponents() {}

    update(deltaMS: number) {}
}
