import * as PIXI from 'pixi.js';
import { ListSelectItem } from './listSelectItem';
import { EffectsManager } from '@systems/effectManager';

interface IListSelectParams<TMetadata> {
    x: number;
    y: number;
    backdropTint: number;
    backdropAlpha: number;
    items: ListSelectItem<TMetadata>[];
    itemsGap: number;
    onSelect: (metadata: TMetadata) => void;
    onClose: () => void;
    animation: boolean;
    removeOnCloseAndSelect: boolean;
}

export class ListSelect<TMetadata> extends PIXI.Container {
    config: IListSelectParams<TMetadata>;

    backDrop!: PIXI.Sprite;
    constructor(config: Partial<IListSelectParams<TMetadata>>) {
        super();
        this.config = {
            x: 0,
            y: 0,
            backdropTint: 0x000000,
            backdropAlpha: 0.66,
            items: [],
            itemsGap: 15,
            onSelect: (metadata: TMetadata) => {},
            onClose: () => {},
            removeOnCloseAndSelect: true,
            animation: true,
            ...config,
        };
        this.x = this.config.x;
        this.y = this.config.y;

        this.createBackDrop();
        this.createList();

        this.alpha = 0;
        this.visible = true;
    }

    createBackDrop() {
        this.backDrop = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.backDrop.tint = 0x000000;
        this.backDrop.alpha = 0.66;
        this.backDrop.width = 4000;
        this.backDrop.height = 4000;
        this.backDrop.anchor.set(0.5);

        this.backDrop.eventMode = 'static';
        this.backDrop.on('pointertap', async () => {
            await this.onHide();
            this.config.onClose();
        });
        this.addChild(this.backDrop);
    }

    createList() {
        if (this.config.items.length) {
            this.config.items.forEach((item, index) => {
                item.eventMode = 'static';
                item.on('pointertap', async () => {
                    await this.onHide();
                    this.config.onSelect(item.metadata);
                });
                item.x = 0;
                item.y = (item.visuals.height + this.config.itemsGap) * index;
            });
        }

        this.addChild(...this.config.items);
    }

    update(deltaMS: number) {
        this.config.items.forEach((item) => {
            item.update(deltaMS);
        });
    }

    private async onHide() {
        await this.hide();
        if (this.config.removeOnCloseAndSelect) {
            this.parent.removeChild(this);
        }
    }

    async show() {
        if (this.config.animation) {
            this.alpha = 0;
            await EffectsManager.alpha(this, {
                alpha: 1,
                durationMS: 200,
            });
        } else {
            this.alpha = 1;
        }
    }

    async hide() {
        if (this.config.animation) {
            await EffectsManager.alpha(this, {
                alpha: 0,
                durationMS: 200,
            });
        } else {
            this.alpha = 0;
        }
    }
}
