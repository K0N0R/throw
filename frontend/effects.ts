import * as PIXI from 'pixi.js';

import { BaseParticleEffect } from './core/containers/effects/baseParticleEffect';
import { preload } from './core/preload';
import { prepreload } from './core/prepreload';
import { JsUtils } from '@common';

export const effects = async () => {
    await prepreload();
    await preload();

    const app = new PIXI.Application();
    await app.init({ resizeTo: window, backgroundColor: 0x000000 });
    document.body.appendChild(app.canvas);

    const texture = PIXI.Texture.from('particle.png'); // wspólny baseTexture dla wszystkich cząsteczek!

    const leavesEffect = new BaseParticleEffect(
        {
            maxParticles: 200,
            emissionRate: 40,
            lifetime: [3.0, 6.0],
            speed: [40, 120],
            scale: [0.5, 1.5],
            alpha: [1, 0],
            angle: [200, 340],
            gravity: 50,
            friction: 0.97,
            tint: [0x2e8b57, 0xcd853f],
            wind: { strength: 25, frequency: 2 },
            angularSpeed: [-90, 90],
            dynamic: { position: true, scale: true, color: true },
        },
        texture,
    );

    const rainEffect = new BaseParticleEffect(
        {
            maxParticles: 1200,
            emissionRate: 500,
            lifetime: [1.0, 1.8],
            speed: [600, 900],
            scale: [0.1, 0.2],
            alpha: [0.8, 0.8],
            angle: [85, 95],
            gravity: 1200,
            tint: [0x88bbff, 0x88bbff],
            wind: { strength: 15, frequency: 3 },
            emitArea: { width: app.renderer.width, height: 0 }, // ⬅️ prostokąt
            dynamic: { position: true, scale: true, color: true },
        },
        texture,
    );

    const explosionEffect = new BaseParticleEffect(
        {
            maxParticles: 500,
            emissionRate: 800, // duży zastrzyk na start
            lifetime: [0.35, 0.6], // krótko żyją
            speed: [320, 680], // duża prędkość
            scale: [0.6, 1.4], // różne rozmiary
            alpha: [1, 0], // szybki fade out
            angle: [0, 360], // we wszystkie strony
            gravity: 0, // czysty radialny wybuch
            dynamic: { position: true, scale: true, color: true },
        },
        texture,
    );

    const fanfareEffect = new BaseParticleEffect(
        {
            maxParticles: 600,
            emissionRate: 600, // mocny zastrzyk, ale nie aż tak gwałtowny
            lifetime: [0.8, 1.6], // nieco dłużej, by „doleciały” dalej
            speed: [500, 900], // bardzo duża prędkość = daleki zasięg
            scale: [0.7, 1.5], // wyraźniejsze „gwiazdki”
            alpha: [1, 0], // stopniowe znikanie
            angle: [0, 360], // 360°
            gravity: 200, // lekki opad, ładny łuk w dół
            dynamic: { position: true, scale: true, color: true },
        },
        texture,
    );

    const effect = new BaseParticleEffect(
        {
            maxParticles: 400,
            emissionRate: 100,
            lifetime: [0.6, 1.4],
            speed: [120, 260],
            scale: [0.6, 1.3],
            alpha: [1, 0],
            angle: [260, 280], // np. "fontanna" do góry
            gravity: 400,
            dynamic: { position: true, scale: true, color: true },
        },
        texture,
    );

    const donutExplosionEffect = new BaseParticleEffect(
        {
            maxParticles: 600,
            lifetime: [0.8, 1.2],
            speed: [600, 1000],
            scale: [1.2, 2.0],
            alpha: [1, 0],
            angle: [0, 360],
            gravity: 0,
            friction: 0.92, // 🔥 spowalnia promień w czasie
            dynamic: { position: true, scale: true, color: true },
        },
        texture,
    );

    const softRandomFadeEffect = new BaseParticleEffect(
        {
            maxParticles: 80,
            emissionRate: 18, // spokojnie, bez sypania
            lifetime: [1.2, 2.0], // dłuższy, miękki fade
            speed: [20, 90], // wolno dryfują
            scale: [0.4, 1.6], // mocno losowa wielkość
            alpha: [0.9, 0], // delikatne zanikanie
            angle: [0, 360], // mogą odpływać w dowolnym kierunku
            gravity: 0, // brak opadu – takie „unoszenie”
            dynamic: { position: true, scale: true, color: true },
        },
        texture,
    );

    const fireBurst = new BaseParticleEffect(
        {
            maxParticles: 350,
            lifetime: [0.6, 1.0],
            speed: [220, 420],
            scale: [0.8, 1.6],
            alpha: [1, 0],
            angle: [0, 360],
            gravity: 120,
            friction: 0.95,
            tint: [0xff6a00, 0xffee00], // pomarańcz -> żółty
            dynamic: { position: true, scale: true, color: true },
        },
        texture,
    );

    const startEffect = async (effect: BaseParticleEffect) => {
        effect.setEmitterPosition(app.renderer.width / 2, app.renderer.height / 2);
        app.stage.addChild(effect);
        effect.emitOnce(200);
        await JsUtils.sleep(3000);
        effect.emitOnce(200);
        await JsUtils.sleep(3000);
        effect.emitOnce(200);
        await JsUtils.sleep(3000);
        effect.emitOnce(200);
        await JsUtils.sleep(3000);
        effect.emitOnce(200);
    };

    startEffect(leavesEffect);
};
