import * as PIXI from 'pixi.js';
import { Box } from './box';
import { Typography } from './typography';
import { CoreConfig } from '@config/coreConfig';

interface IMessageBoxParams {
    textSize: number;
    text: string;
    textColor: number;
    maxTextWidth: number;
    paddingRatio: number;
    boxColor: number;
}

export class MessageBox extends PIXI.Container {
    box!: Box;
    text!: Typography;
    config: IMessageBoxParams;
    constructor(config: Partial<IMessageBoxParams>) {
        super();

        this.config = {
            text: '',
            textSize: 30,
            textColor: 0xffffff,
            maxTextWidth: 800,
            paddingRatio: 1.25,
            boxColor: 0x000000,
            ...config,
        };
        this.createComponents();
    }

    createComponents() {
        this.text = new Typography({
            text: this.config.text,
            size: this.config.textSize,
            verticalAlign: 'center',
            horizontalAlign: 'center',
            color: CoreConfig.primaryContrastColor,
            styleProps: { wordWrap: true, wordWrapWidth: this.config.maxTextWidth },
        });

        this.box = new Box({
            width: this.text.width * this.config.paddingRatio,
            height: this.text.height * this.config.paddingRatio,
            tint: this.config.boxColor,
            anchor: 'mid',
        });
        this.addChild(this.box, this.text);
    }

    setText(text: string) {
        this.text.setText(text);
        this.box.updateBox({
            width: this.text.width * this.config.paddingRatio,
            height: this.text.height * this.config.paddingRatio,
        });
    }
}
