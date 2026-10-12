import * as PIXI from 'pixi.js';
import { SoundManager } from '@systems/soundManager';
import { GameSettings } from '@systems/gameSettings';
import { InputHandler } from '@systems/inputHandler';
import { MusicManager } from '@systems/musicManager';
import { PopupContainer } from '@popup/popupContainer';
import { GameState } from '@systems/gameState';

import { Core } from './core/core';
import { preload } from './core/preload';
import { prepreload } from './core/prepreload';

const init = async () => {
    const core = new Core();

    if (DEBUG) {
        console.log('debug build');
        (window as any).devApi = {
            PIXI,
            Assets: PIXI.Assets,
            SoundManager,
            core,
            textures: () => Object.fromEntries((PIXI.Assets.cache as any)._cache.entries()),
        };
    } else {
        console.log('production build');
    }
    GameSettings.init();
    InputHandler.init();
    SoundManager.init();
    MusicManager.init();
    await prepreload();
    await core.init();
    globalThis.__PIXI_APP__ = core.app; // for pixi chrome plugin to work, can be behind DEBUG flag
    PopupContainer.showLoader();
    await preload();
    core.instantiateComponents();
    PopupContainer.instantiatePopups();
    PopupContainer.hideLoader();
    await PopupContainer.show('welcome');
    GameState.goToLobby();
};
init();
