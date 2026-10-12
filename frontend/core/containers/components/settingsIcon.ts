import * as PIXI from 'pixi.js';
export class SettingsIcon extends PIXI.Container {
    sprite: PIXI.Sprite;
    constructor() {
        super();
        this.sprite = new PIXI.Sprite(PIXI.Assets.get('settings.png'));
        this.sprite.anchor.set(0.5);
        const scale = 30 / Math.max(this.sprite.width, this.sprite.height);
        this.sprite.scale.set(scale);
        this.addChild(this.sprite);
    }
}
