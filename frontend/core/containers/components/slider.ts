import * as PIXI from 'pixi.js';
import { Box } from './box';
import { IPosition } from '@common';
import { CoreConfig } from '@config/coreConfig';
import { Bus } from '@systems/bus';

interface ISliderParams {
    width: number;
    height: number;
    outlineColor: number;
    outlineAlpha: number;
    fillColor: number;
    roundness: number;
    sliderWidth: number;
    sliderColor: number;
}

export class Slider extends PIXI.Container {
    boxOutline!: Box;
    boxMask!: Box;
    boxFill!: Box;
    slider!: Box;

    dragging: boolean = false;
    pointerPosition: IPosition = { x: 0, y: 0 };
    pointerDown: boolean = false;
    config: ISliderParams;

    constructor(
        config: Partial<ISliderParams>,
        initialPercentage: number,
        private onUpdate: (percentage: number) => void,
    ) {
        super();
        const defaultConfig: ISliderParams = {
            width: 200,
            height: 50,
            outlineColor: CoreConfig.primaryContrastColor,
            outlineAlpha: 0.5,
            fillColor: CoreConfig.primaryColor,
            roundness: CoreConfig.roundness,
            sliderWidth: 20,
            sliderColor: CoreConfig.primaryContrastColor,
        };

        this.config = { ...defaultConfig, ...config };

        this.bindEvents();
        this.createComponents(this.config, initialPercentage);
    }

    bindEvents() {
        Bus.subscribe(
            'input',
            (message) => {
                switch (message.name) {
                    case 'pointermove':
                        this.pointerPosition = message.data;
                        break;
                    case 'pointerdown':
                        this.pointerDown = message.data;
                        break;
                }
            },
            this,
        );
    }

    createComponents(config: ISliderParams, percentage: number) {
        this.boxOutline = new Box({
            width: config.width,
            height: config.height,
            tint: config.outlineColor,
            alpha: config.outlineAlpha,
            roundness: config.roundness,
            anchor: 'leftTop',
        });
        this.boxFill = new Box({
            width: 15,
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
        this.slider = new Box({
            width: config.sliderWidth,
            height: config.height * 1.1,
            tint: 0xffffff,
            alpha: 1,
            anchor: 'leftTop',
        });
        this.slider.y = -config.height * 0.05;

        this.updatePercentage(percentage);

        this.eventMode = 'static';
        const onDown = ($event: PIXI.FederatedPointerEvent) => {
            this.dragging = true;
        };
        this.on('pointerdown', onDown);

        this.addChild(this.boxOutline, this.boxMask, this.boxFill, this.slider);
    }

    updatePercentage(value: number) {
        this.boxFill.width = this.boxOutline.width * value;
        this.slider.position.x = (this.boxOutline.width - this.slider.width) * value;
    }

    update(deltaMS: number) {
        if (this.dragging && this.pointerDown) {
            this.slider.position.x = Math.max(
                0,
                Math.min(
                    -this.x + this.parent.toLocal(this.pointerPosition).x,
                    this.boxOutline.x + this.boxOutline.width - this.slider.width,
                ),
            );
            const percentage = this.slider.position.x / (this.boxOutline.width - this.slider.width);
            this.onUpdate(this.slider.position.x / (this.boxOutline.width - this.slider.width));

            this.boxFill.width = this.boxOutline.width * percentage;
        } else {
            this.dragging = false;
        }
    }
}
