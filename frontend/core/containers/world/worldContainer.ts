import * as PIXI from 'pixi.js';

export class WorldContainer extends PIXI.Container {
    constructor() {
        super();
        this.sortableChildren = true;
    }

    update(deltaMS: number) {
        // Update logic for the world container can be added here
    }
}
