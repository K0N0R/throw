import * as PIXI from 'pixi.js';
import { WorldContainer } from '@world/worldContainer';
import { PopupContainer } from '@popup/popupContainer';
import { GameState } from '@systems/gameState';
import { CoreConfig } from '@config/coreConfig';
import { UiContainer } from '@ui/uiContainer';
import { UiTime, WorldTime } from '@systems/time';
import { EffectsManager } from '@systems/effectManager';
import { Bus } from '@systems/bus';
import { Background } from '@entities/background';

export class Core {
    app!: PIXI.Application;

    timeScale = 1;
    background!: Background;
    worldContainer!: WorldContainer;

    uiContainer!: UiContainer;
    popupContainer!: PopupContainer;
    scalableContainers: PIXI.Container[] = [];

    update(ticker: PIXI.Ticker) {
        if (ticker.deltaMS > 100) {
            return;
        }
        UiTime.update(ticker.deltaMS);
        EffectsManager.updateUi(ticker.deltaMS);
        this.uiContainer?.update(ticker.deltaMS);
        this.popupContainer.update(ticker.deltaMS);
        this.background.update(ticker.deltaMS);

        if (GameState.state === 'initialization') {
        } else {
            const scaledDeltaMS = ticker.deltaMS * this.timeScale;

            WorldTime.update(scaledDeltaMS);
            EffectsManager.updateGameplay(scaledDeltaMS);
            this.worldContainer?.update(scaledDeltaMS);
        }
    }

    async init() {
        await this.instantiateApp();
        this.watchContainersForResize();
        this.instantiateInitialComponents();
        this.app.ticker.add(this.update.bind(this));
        this.bindEvents();
    }

    async instantiateApp() {
        this.app = new PIXI.Application();
        await this.app.init({
            resizeTo: window,
            backgroundColor: 0x000000,
            antialias: false,
        });

        this.app.canvas.addEventListener('contextmenu', (evt) => evt.preventDefault());
        document.body.appendChild(this.app.canvas);
    }

    private instantiateInitialComponents() {
        this.background = new Background();
        PopupContainer.createInstance();
        this.popupContainer = PopupContainer.instance;
        this.app.stage.addChild(this.background, PopupContainer.instance);
        this.scalableContainers.push(this.background, PopupContainer.instance);
        this.triggerResize();
    }

    public instantiateComponents() {
        this.uiContainer = new UiContainer();
        this.worldContainer = new WorldContainer();
        this.app.stage.addChild(this.worldContainer, this.uiContainer);
        this.scalableContainers.push(this.uiContainer, this.worldContainer);
        this.triggerResize();
    }

    private watchContainersForResize() {
        this.app.renderer.on('resize', (width, height) => {
            Bus.emit('input', { name: 'resize', data: { width, height } });
            this.scalableContainers.forEach((scalable) => {
                this.calculateObjectRatio(scalable, width, height);
            });
        });
    }

    private triggerResize() {
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
    }

    bindEvents() {
        Bus.subscribe(
            'system',
            (message) => {
                switch (message.name) {
                    case 'time-scale': {
                        EffectsManager.value(this, {
                            value: message.data.timeScale,
                            fieldName: 'timeScale',
                            durationMS: 500,
                        });
                    }
                }
            },
            this,
        );
    }

    calculateObjectRatio(object: PIXI.Container, width: number, height: number) {
        const targetRatio = CoreConfig.ratio.y / CoreConfig.ratio.x;
        const windowRatio = height / width;

        if (windowRatio > targetRatio) {
            const scale = width / CoreConfig.width;
            object.scale.set(scale);
            object.x = 0;
            object.y = (height - CoreConfig.height * scale) / 2;
        } else {
            const scale = height / CoreConfig.height;
            object.scale.set(scale);
            object.y = 0;
            object.x = (width - CoreConfig.width * scale) / 2;
        }
    }
}
