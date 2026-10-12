import * as PIXI from 'pixi.js';
import { Typography } from './typography';
import { defaultTextConfig } from '@config/textConfig';

export class TextList extends PIXI.Container {
    texts: TextListItem[] = [];
    constructor(
        texts: string[],
        private numeric: boolean,
    ) {
        super();
        texts.forEach((text, nth) => {
            const indicator = this.numeric ? `${nth + 1}.` : '•';
            const textListItem = new TextListItem(indicator, text);
            this.texts.push(textListItem);
        });
        this.addChild(...this.texts);

        let currentY = 0;
        this.texts.forEach((text) => {
            text.y = currentY;
            currentY += text.height + 10;
        });
    }
}

export class TextListItem extends PIXI.Container {
    numberText: Typography;
    text: Typography;
    constructor(indicator: number | string, text: string) {
        super();
        this.numberText = new Typography({
            ...defaultTextConfig,
            text: indicator,
        });
        this.text = new Typography({
            ...defaultTextConfig,
            text: text,
        });
        this.text.x = this.numberText.width + 10;
        this.addChild(this.numberText, this.text);
    }
}
