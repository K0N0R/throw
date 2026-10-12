import * as PIXI from 'pixi.js';
import { Button } from './button';
import { ArrowDownIcon, ArrowUpIcon } from './arrowIcon';
import { EffectsManager } from '@systems/effectManager';
import { Bus } from '@systems/bus';

export interface IScrollAreaParams {
    width: number;
    height: number;
    verticalPadding: number;
}

export class ScrollArea extends PIXI.Container {
    viewport!: PIXI.Sprite;
    scrollTop!: Button;
    scrollBot!: Button;
    contentContainer!: PIXI.Container;

    scrollingDelta = 0;
    scrollableAreaScrollStartY = 0;
    isScrolling = false;

    constructor(private config: IScrollAreaParams) {
        super();

        this.createMask();
        this.createContent();
        this.createButtons();

        this.setHandlers();
    }

    private createMask(): void {
        const maskSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        maskSprite.x = 0;
        maskSprite.y = 0;
        maskSprite.scale.set(this.config.width, this.config.height);
        maskSprite.anchor.set(0);
        this.mask = maskSprite;
        this.addChild(maskSprite);
    }

    private createButtons() {
        const buttonSize = 45;

        const arrowDown = new ArrowDownIcon();
        this.scrollBot = new Button({
            x: this.config.width - buttonSize / 2,
            y: this.config.height - buttonSize / 2,
            width: buttonSize,
            height: buttonSize,
            alpha: 0.01,
            onClick: () => {
                this.scrollingDelta += 100;
            },
            onHover: async () => {
                await EffectsManager.scale(arrowDown, { x: 1.1, y: 1.1, durationMS: 200 });
            },
            onHoverEnd: async () => {
                await EffectsManager.scale(arrowDown, { x: 1, y: 1, durationMS: 200 });
            },
            children: [arrowDown],
        });
        const arrowUp = new ArrowUpIcon();
        this.scrollTop = new Button({
            x: this.config.width - buttonSize / 2,
            y: buttonSize / 2,
            width: buttonSize,
            height: buttonSize,
            alpha: 0.01,
            onClick: () => {
                this.scrollingDelta -= 100;
            },
            onHover: async () => {
                await EffectsManager.scale(arrowUp, { x: 1.1, y: 1.1, durationMS: 200 });
            },
            onHoverEnd: async () => {
                await EffectsManager.scale(arrowUp, { x: 1, y: 1, durationMS: 200 });
            },
            children: [arrowUp],
        });
        this.addChild(this.scrollBot, this.scrollTop);
    }

    private setHandlers() {
        this.eventMode = 'static';
        this.on('pointerdown', (e) => {
            this.isScrolling = true;
            this.scrollableAreaScrollStartY = e.global.y;
        });

        this.on('pointermove', (e) => {
            if (this.isScrolling) {
                const sign = Math.sign(this.scrollableAreaScrollStartY - e.global.y);
                const value = Math.abs(this.scrollableAreaScrollStartY - e.global.y);
                this.scrollingDelta = Math.min(value, 100) * sign;
            }
        });

        Bus.subscribe(
            'input',
            (message) => {
                switch (message.name) {
                    case 'wheel': {
                        if (this.visible) {
                            this.scrollingDelta = message.data;
                        }
                        break;
                    }
                    case 'pointerdown': {
                        if (!message.data) {
                            this.isScrolling = false;
                        }
                    }
                }
            },
            this,
        );
    }

    private createContent() {
        this.contentContainer = new PIXI.Container();
        this.addChild(this.contentContainer);

        this.viewport = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.viewport.x = 0;
        this.viewport.y = 0;
        this.viewport.scale.set(this.config.width, this.config.height);
        this.viewport.anchor.set(0);
        this.viewport.alpha = 0;
        this.contentContainer.addChild(this.viewport);
    }

    private scroll() {
        if (Math.abs(this.scrollingDelta) < 10) return;
        this.contentContainer.y += -this.scrollingDelta * 0.1;
        this.scrollingDelta *= 0.9;
        if (
            this.contentContainer.y <
            -this.contentContainer.height + this.viewport.height - this.config.verticalPadding
        ) {
            this.contentContainer.y =
                -this.contentContainer.height + this.viewport.height - this.config.verticalPadding;
        }
        if (this.contentContainer.y > 0) {
            this.contentContainer.y = 0;
        }
    }

    update(deltaMS: number) {
        const isScrollable = this.contentContainer.height > this.config.height;
        this.scrollTop.visible = isScrollable;
        this.scrollBot.visible = isScrollable;

        if (isScrollable) {
            this.scroll();
        }
    }
}
