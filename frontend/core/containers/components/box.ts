import * as PIXI from 'pixi.js';
import { CoreConfig } from '@config/coreConfig';

export type TBoxAnchor = 'leftTop' | 'mid';
export interface IBoxParams {
    x: number;
    y: number;
    width: number;
    height: number;
    alpha: number;
    tint: number;
    roundness: number;
    anchor: TBoxAnchor;
    outlineWidth: number;
    outlineTint: number;
}

export class Box extends PIXI.Container {
    box!: PIXI.Graphics;
    config: IBoxParams;
    constructor(config: Partial<IBoxParams>) {
        super();
        this.config = {
            x: 0,
            y: 0,
            width: 50,
            height: 50,
            alpha: 0.9,
            tint: 0xffffff,
            roundness: CoreConfig.roundness,
            anchor: 'mid',
            outlineWidth: 0,
            outlineTint: 0x000000,
            ...config,
        };

        this.createBox(this.config);
    }

    createBox(config: IBoxParams) {
        this.box = new PIXI.Graphics();
        const x = config.anchor === 'mid' ? -config.width / 2 : 0;
        const y = config.anchor === 'mid' ? -config.height / 2 : 0;

        this.box.roundRect(x, y, config.width, config.height, config.roundness);
        this.box.fill({ color: config.tint });
        this.box.stroke({ width: config.outlineWidth, color: config.outlineTint });

        this.box.alpha = config.alpha;
        this.addChild(this.box);

        this.x = config.x;
        this.y = config.y;
    }

    updateBox(config: Partial<IBoxParams>) {
        this.config = {
            ...this.config,
            ...config,
        };

        this.removeChild(this.box);
        this.createBox(this.config);
    }
}
