import * as PIXI from 'pixi.js';
import { PixiUtils, TExtendedDisplayObject } from '@common';
import { EffectsManager, TEffectConfigGroup } from '@systems/effectManager';
import { CoreConfig } from '@config/coreConfig';

import { Box, IBoxParams } from './box';

export interface IButtonParams extends IBoxParams {
    x: number;
    y: number;
    onClick: () => void;
    onHover: () => void;
    onHoverEnd: () => void;
    metadata: any;
    children: TExtendedDisplayObject[];
    group: TEffectConfigGroup;
}

export class Button extends PIXI.Container {
    public box: Box;
    public config: IButtonParams;

    constructor(config: Partial<IButtonParams>) {
        super();

        this.config = {
            x: 0,
            y: 0,
            width: 50,
            height: 50,
            tint: CoreConfig.primaryColor,
            outlineWidth: 0,
            outlineTint: 0xffffff,
            alpha: 1,
            roundness: CoreConfig.roundness,
            onClick: () => {},
            onHover: () => {},
            onHoverEnd: () => {},
            metadata: null,
            children: [],
            group: 'ui',
            anchor: 'mid',
            ...config,
        };

        this.position.set(config.x, config.y);
        this.box = new Box({
            ...this.config,
            x: 0,
            y: 0,
        });

        this.addChild(this.box);

        if (Array.isArray(config.children) && config.children.length > 0) {
            this.addChild(...config.children.map(PixiUtils.applyExtendedDisplayObjectParams));
            config.children.forEach((child) => {
                child.eventMode = 'none';
            });
        }

        this.x = this.config.x;
        this.y = this.config.y;

        this.setInteractions();
    }

    private setInteractions() {
        const onHover = async () => {
            if (this.config.onHover) this.config.onHover();

            EffectsManager.clearAllEffectsFromContainer(this);
            await EffectsManager.scale(this.box, {
                x: 1.2,
                y: 1.2,
                durationMS: 200,
                group: this.config.group,
            });
        };

        const onHoverEnd = async () => {
            if (this.config.onHoverEnd) this.config.onHoverEnd();

            EffectsManager.clearAllEffectsFromContainer(this);
            await EffectsManager.scale(this.box, {
                x: 1,
                y: 1,
                durationMS: 200,
                group: this.config.group,
            });
        };

        const onClick = async () => {
            if (this.config.onClick) {
                this.config.onClick();
            }
        };

        this.box.eventMode = 'static';
        this.box.on('pointerenter', onHover);
        this.box.on('pointerleave', onHoverEnd);
        this.box.on('pointercancel', onHoverEnd);
        this.box.on('pointercancelcapture', onHoverEnd);
        //this.box.on('pointertap', onClick);
        this.box.on('pointerdown', onClick);
    }
}
