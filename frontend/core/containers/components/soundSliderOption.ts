import * as PIXI from 'pixi.js';
import { Button } from './button';
import { Slider } from './slider';
import { SoundIcon } from './soundIcon';
import { Typography } from './typography';

export class SoundSliderOption extends PIXI.Container {
    icon!: SoundIcon;
    title!: Typography;
    button!: Button;
    slider!: Slider;
    constructor(
        public label: string,
        public switchToggle: () => void,
        public onManualChange: (value: any) => void,
        public isEnabled: () => any,
        public getValue: () => any,
    ) {
        super();
        this.createComponents();
        this.updateButton();
    }

    private createComponents() {
        this.title = new Typography({
            text: this.label,
            size: 16,
            horizontalAlign: 'left',
            verticalAlign: 'center',
        });
        this.title.x = 0;
        this.title.y = 0;
        this.addChild(this.title);
        this.icon = new SoundIcon();
        this.button = new Button({
            x: this.title.x + Math.max(this.title.width + 25, 200),
            y: 0,
            width: 50,
            height: 50,
            alpha: 1,
            onClick: () => {
                this.switchToggle();
                this.slider.updatePercentage(this.getValue());
                this.updateButton();
            },
            children: [this.icon],
        });
        this.addChild(this.button);
        this.slider = new Slider({}, this.getValue(), (percentage: number) => {
            this.switchToggle();
            this.onManualChange(percentage);
            this.updateButton();
        });
        this.slider.x = this.button.x + 25;
        this.slider.y = -25;
        this.addChild(this.slider);
    }

    updateButton() {
        this.icon.setEnabled(this.isEnabled());
        this.button.box.tint = this.isEnabled() ? 0x0ba5aa : 0x818685;
    }

    update(deltaMS: number) {
        this.slider.update(deltaMS);
    }
}
