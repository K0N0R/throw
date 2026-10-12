import * as PIXI from 'pixi.js';

export interface IIconParams {
    sprite: string;
    size: number;
    animated?: boolean;
}

export class Icon extends PIXI.Container {
    sprite: PIXI.Sprite;
    config: IIconParams;
    constructor(config: Partial<IIconParams>) {
        super();
        this.config = {
            sprite: '',
            size: 40,
            animated: false,
            ...config,
        };

        this.sprite = new PIXI.Sprite(PIXI.Assets.get(this.config.sprite));
        this.sprite.anchor.set(0.5);
        const scale = this.config.size / Math.max(this.sprite.width, this.sprite.height);
        this.sprite.scale.set(scale);
        this.eventMode = 'none';
        this.addChild(this.sprite);
    }
}
