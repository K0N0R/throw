import { CoreConfig } from '@config/coreConfig';
import * as PIXI from 'pixi.js';

export class Background extends PIXI.Container {
    sprite!: PIXI.Sprite;
    constructor() {
        super();
        this.initSprite();
    }

    initSprite() {
        this.sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.sprite.width = CoreConfig.width;
        this.sprite.height = CoreConfig.height;
        this.sprite.tint = 0x007f83;
        this.sprite.alpha = 1;
        this.addChild(this.sprite);
    }

    update(deltaMS: number) {}
}
