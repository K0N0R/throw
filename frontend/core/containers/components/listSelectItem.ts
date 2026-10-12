import * as PIXI from 'pixi.js';

interface IListSelectItemVisuals extends PIXI.Container {
    update?: (delayMS: number) => void;
}

export class ListSelectItem<TMetadata> extends PIXI.Container {
    constructor(
        public visuals: IListSelectItemVisuals,
        public metadata: TMetadata,
    ) {
        super();

        this.addChild(this.visuals);
    }

    update(deltaMS: number) {
        this.visuals.update?.(deltaMS);
    }
}
