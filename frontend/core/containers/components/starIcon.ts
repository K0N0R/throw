import { EffectsManager } from '@systems/effectManager';
import * as PIXI from 'pixi.js';
import { BaseParticleEffect } from '../effects/baseParticleEffect';

export interface IStarIconParams {
    amount: number;
    center: boolean;
    size: number;
    spaceBetween: number;
    shadow: boolean;
    empty: boolean;
}

export class StarIcon extends PIXI.Container {
    stars: PIXI.Sprite[] = [];
    starEffects: BaseParticleEffect[] = [];
    desiredScale!: number;
    constructor(public params: Partial<IStarIconParams>) {
        super();
        this.createStars(params);
    }

    createStars(params: Partial<IStarIconParams>) {
        this.params = params;
        const amount = params.amount ?? 1;
        const center = params.center ?? true;
        const size = params.size ?? 25;
        const spaceBetween = params.spaceBetween ?? size * 0.8;

        if (this.stars.length) {
            this.removeChild(...this.stars);
            this.stars = [];
        }
        if (this.starEffects.length) {
            this.removeChild(...this.starEffects);
            this.starEffects = [];
        }

        const texture = PIXI.Assets.get(params.empty ? 'star-empty.png' : 'star.png');
        for (let i = 0; i < amount; i++) {
            if (params.shadow) {
                const sprite = new PIXI.Sprite(texture);
                this.desiredScale = size / Math.max(sprite.width, sprite.height);
                sprite.anchor.set(0, 0.5);
                sprite.scale.set(this.desiredScale);
                sprite.x = i * spaceBetween + 2;
                sprite.y = 2;
                sprite.tint = 0x000000;
                this.addChild(sprite);
                this.stars.push(sprite);
            }

            const sprite = new PIXI.Sprite(texture);
            this.desiredScale = size / Math.max(sprite.width, sprite.height);
            sprite.anchor.set(0, 0.5);
            sprite.scale.set(this.desiredScale);
            sprite.x = i * spaceBetween;
            this.addChild(sprite);
            this.stars.push(sprite);

            const starEffect = new BaseParticleEffect(
                {
                    maxParticles: 200,
                    emissionRate: 600, // mocny zastrzyk, ale nie aż tak gwałtowny
                    lifetime: [0.5, 1.25], // nieco dłużej, by „doleciały” dalej
                    speed: [50, 100], // bardzo duża prędkość = daleki zasięg
                    scale: [0.025, 0.1], // wyraźniejsze „gwiazdki”
                    alpha: [1, 0], // stopniowe znikanie
                    angle: [0, 360], // 360°
                    gravity: 100, // lekki opad, ładny łuk w dół
                    dynamic: { position: true, scale: true, color: true },
                },
                texture,
            );
            starEffect.x = i * spaceBetween + sprite.width / 2;
            this.addChild(starEffect);
            this.starEffects.push(starEffect);
        }
        if (center) {
            this.pivot.x = this.width / 2;
        }
    }

    async animate() {
        this.stars.forEach((star) => {
            star.alpha = 0;
            star.scale.set(0);
        });
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            const starEffect = this.starEffects[i];
            starEffect.emitOnce();
            EffectsManager.scale(star, {
                x: this.desiredScale,
                y: this.desiredScale,
                durationMS: 500,
                easing: EffectsManager.easing.Bounce.Out,
            });
            await EffectsManager.alpha(star, { alpha: 1, durationMS: 250 });
        }
    }
}
