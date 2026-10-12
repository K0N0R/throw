import * as PIXI from 'pixi.js';

export async function prepreload() {
    await PIXI.Assets.init({ basePath: './assets/' });

    const pngAssets: string[] = [];
    await PIXI.Assets.load([...pngAssets]);
}
