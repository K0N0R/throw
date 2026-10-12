import * as PIXI from 'pixi.js';
import { Box } from './box';
import { CoreConfig } from '@config/coreConfig';

interface IProgressBarParams {
    width: number;
    height: number;
    outlineWidth: number;
    outlineColor: number;
    fillColor: number;
    roundness: number;
}

export class ProgressBar extends PIXI.Container {
    boxOutline!: Box;
    boxMask!: Box;
    boxFill!: Box;
    fillPercentage = 0;
    config: IProgressBarParams;

    constructor(config: Partial<IProgressBarParams>) {
        super();
        const defaultConfig = {
            width: 200,
            height: 50,
            outlineWidth: 6,
            outlineColor: CoreConfig.primaryContrastColor,
            fillColor: CoreConfig.primaryColor,
            roundness: CoreConfig.roundness,
        };

        const mergedConfig = {
            ...defaultConfig,
            ...config,
        };
        this.config = mergedConfig;
        this.createComponents(mergedConfig);
    }

    createComponents(config: IProgressBarParams) {
        this.boxOutline = new Box({
            width: config.width + config.outlineWidth,
            height: config.height + config.outlineWidth,
            tint: config.outlineColor,
            alpha: 1,
            roundness: config.roundness,
            anchor: 'leftTop',
        });
        this.boxFill = new Box({
            width: config.width,
            height: config.height,
            tint: config.fillColor,
            alpha: 1,
            roundness: 0,
            anchor: 'leftTop',
        });
        this.boxMask = new Box({
            width: config.width,
            height: config.height,
            tint: 0xffffff,
            alpha: 1,
            roundness: config.roundness,
            anchor: 'leftTop',
        });
        this.boxFill.mask = this.boxMask;
        this.boxFill.width = 0;
        this.updatePercentage(0);
        this.boxOutline.x = -config.outlineWidth / 2;
        this.boxOutline.y = -config.outlineWidth / 2;
        this.addChild(this.boxOutline, this.boxMask, this.boxFill);
    }

    updatePercentage(value: number) {
        this.fillPercentage = value;
    }

    update(deltaMS: number) {
        const deltaWidth = this.config.width * this.fillPercentage - this.boxFill.width;
        this.boxFill.width = this.boxFill.width + deltaWidth / 50;
    }
}
