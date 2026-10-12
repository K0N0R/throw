import * as PIXI from 'pixi.js';

import { BasePopup } from './basePopup';
import { CoreConfig } from '@config/coreConfig';
import { Button } from '@components/button';
import { Typography } from '@components/typography';
import { ScrollArea } from '@components/scrollArea';
import { Box } from '@components/box';
import { GameSettings } from '@systems/gameSettings';
import { SoundSliderOption } from '@components/soundSliderOption';
import { Backdrop } from '@components/backdrop';

export class ConfigurationPopup extends BasePopup<never> {
    backdrop!: Backdrop;
    box!: Box;
    title!: Typography;
    closeButton!: Button;
    musicSlider!: SoundSliderOption;
    soundSlider!: SoundSliderOption;
    scrollArea!: ScrollArea;
    advancedContainer!: PIXI.Container;

    constructor() {
        super();
        this.createBaseComponents();
        this.createAdvancedComponents();
    }

    createBaseComponents(): void {
        this.backdrop = new Backdrop();
        this.addChild(this.backdrop);

        this.box = new Box({
            x: CoreConfig.centerX,
            y: CoreConfig.centerY,
            width: CoreConfig.width,
            height: CoreConfig.height,
            roundness: 0,
            alpha: 0.99,
            anchor: 'mid',
            tint: 0x002b2c,
        });
        this.addChild(this.box);

        this.closeButton = new Button({
            x: CoreConfig.width - CoreConfig.height * 0.05,
            y: CoreConfig.height * 0.05,
            width: 50,
            height: 50,
            tint: 0xd3d3d3,
            onClick: () => {
                this.promise.resolve();
            },
            roundness: 100,
            alpha: 1,
            children: [new Typography({ text: '✖', color: 0x000000 })],
        });

        this.addChild(this.closeButton);

        this.title = new Typography({ text: 'Opcje', color: 0xffffff, size: 28 });
        this.title.x = CoreConfig.width / 2;
        this.title.y = 50;
        this.addChild(this.title);
    }

    private createAdvancedComponents() {
        this.scrollArea = new ScrollArea({
            width: CoreConfig.width * 0.9,
            height: CoreConfig.height * 0.785,
            verticalPadding: 50,
        });
        this.scrollArea.x = CoreConfig.width * 0.05;
        this.scrollArea.y = CoreConfig.height * 0.2;
        this.addChild(this.scrollArea);

        this.advancedContainer = new PIXI.Container();
        this.scrollArea.contentContainer.addChild(this.advancedContainer);

        this.musicSlider = new SoundSliderOption(
            'Muzyka',
            () => {
                GameSettings.musicEnabled = !GameSettings.musicEnabled;
            },
            (percentage) => {
                return (GameSettings.musicVolume = percentage);
            },
            () => {
                return GameSettings.musicEnabled;
            },
            () => {
                return GameSettings.musicEnabled ? GameSettings.musicVolume : 0;
            },
        );
        this.advancedContainer.addChild(this.musicSlider);
        this.musicSlider.y = 50;

        this.soundSlider = new SoundSliderOption(
            'Efekty dźwiękowe',
            () => {
                GameSettings.effectsEnabled = !GameSettings.effectsEnabled;
            },
            (percentage) => {
                return (GameSettings.effectsVolume = percentage);
            },
            () => {
                return GameSettings.effectsEnabled;
            },
            () => {
                return GameSettings.effectsEnabled ? GameSettings.effectsVolume : 0;
            },
        );
        this.advancedContainer.addChild(this.soundSlider);
        this.soundSlider.y = 110;

        this.advancedContainer.x = 75;
    }

    update(deltaMS: number) {
        this.scrollArea.update(deltaMS);
        this.musicSlider.update(deltaMS);
        this.soundSlider.update(deltaMS);
    }
}
