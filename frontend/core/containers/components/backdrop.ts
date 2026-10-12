import { CoreConfig } from '@config/coreConfig';
import * as PIXI from 'pixi.js';

export class Backdrop extends PIXI.Container {
    sprite: PIXI.Sprite;
    constructor(private onClick?: () => Promise<void>) {
        super();

        this.sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.sprite.width = 4000;
        this.sprite.height = 4000;
        this.sprite.anchor.set(0.5);
        this.sprite.tint = CoreConfig.darkColor;
        this.sprite.alpha = 0.85;
        this.sprite.x = CoreConfig.centerX;
        this.sprite.y = CoreConfig.centerY;
        this.sprite.eventMode = 'static';
        this.addChild(this.sprite);

        this.sprite.on('pointertap', async () => {
            if (this.onClick) {
                this.onClick();
            }
        });
    }
}
