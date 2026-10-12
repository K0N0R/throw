import * as PIXI from 'pixi.js';
import { Button } from './button';
import { Icon } from './icon';
import { Typography } from './typography';

export interface IToggleOptionParams {
    label: string;
}

export class ToggleOption extends PIXI.Container {
    area!: PIXI.Sprite;
    button!: Button;
    buttonIcon!: Icon;
    text!: Typography;
    constructor(
        private config: IToggleOptionParams,
        private triggerValueChange: () => void,
        private getValue: () => boolean,
    ) {
        super();

        this.createComponents();
        this.updateComponents();
    }

    createComponents() {
        this.buttonIcon = new Icon({ size: 30, sprite: 'check.png' });
        this.button = new Button({
            width: 45,
            height: 45,
            children: [this.buttonIcon],
        });
        this.button.x = 22.5;
        this.text = new Typography({ text: this.config.label, horizontalAlign: 'left', size: 16 });
        this.text.x = this.button.x + this.button.width + 15;

        this.eventMode = 'static';
        this.on('pointertap', () => {
            this.triggerValueChange();
            this.updateComponents();
        });

        this.addChild(this.button, this.text);

        this.area = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.area.width = this.width - this.button.width;
        this.area.height = this.height;
        this.area.x = this.button.width;
        this.area.anchor.set(0, 0.5);
        this.area.alpha = 0;
        this.addChild(this.area);
    }

    updateComponents() {
        this.buttonIcon.visible = this.getValue();
    }
}
