import * as PIXI from 'pixi.js';
import { ProgressBar } from '@components/progressBar';
import { CoreConfig } from '@config/coreConfig';
import { Bus } from '@systems/bus';

export class LoaderPopup extends PIXI.Container {
    progressBar!: ProgressBar;

    constructor() {
        super();

        this.createProgressBar();
        this.bindEvents();
    }

    bindEvents() {
        Bus.subscribe(
            'system',
            (message) => {
                switch (message.name) {
                    case 'preload': {
                        this.progressBar.updatePercentage(message.data);
                        break;
                    }
                }
            },
            this,
        );
    }

    createProgressBar() {
        this.progressBar = new ProgressBar({ width: 200, height: 50 });
        this.progressBar.x = CoreConfig.centerX - this.progressBar.width / 2;
        this.progressBar.y = CoreConfig.centerY + 150;
        this.addChild(this.progressBar);
    }

    update(deltaMS: number) {
        this.progressBar.update(deltaMS);
    }
}
