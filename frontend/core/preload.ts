import * as PIXI from 'pixi.js';
import { Bus } from '@systems/bus';
import { GameSettings } from '@systems/gameSettings';

const preloadConfig = require('../preload-config.json');

export async function preload() {
    const onProgress = (percentage: number) => {
        Bus.emit('system', { name: 'preload', data: percentage });
    };
    let preload = [...preloadConfig];

    if (!GameSettings.soundEnabled) {
        preload = preloadConfig.filter(
            (i: string) => !i.includes('.ogg') && !i.includes('.m4a') && !i.includes('.mp3'),
        );
    }
    await PIXI.Assets.load(preload, onProgress);
}
