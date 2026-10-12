import * as PIXI from 'pixi.js';
import { ITypographyParams, Typography } from './typography';

export class TextSection extends PIXI.Container {
    title: Typography;

    constructor(
        titleConfig: Partial<ITypographyParams>,
        private content: PIXI.Container,
    ) {
        super();

        this.title = new Typography({ size: 24, horizontalAlign: 'left', ...titleConfig });
        this.content.y = this.title.y + this.title.height + 15;
        this.addChild(this.title, this.content);
    }
}
