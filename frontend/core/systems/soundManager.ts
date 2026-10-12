import * as PIXI_SOUND from '@pixi/sound';
import * as PIXI from 'pixi.js';
import { EffectsManager } from './effectManager';
import { GameSettings } from './gameSettings';
import { JsUtils } from '@common';

export type TPlaySoundConfig = {
    soundName: string;
    volume?: number;
    loop?: boolean;
    group?: string;
    onEnd?: () => void;
};

export type TSound = {
    soundName: string;
    volume: number;
    startTimeMS: number;
    pixiSound: PIXI_SOUND.Sound;
    instance: PIXI_SOUND.IMediaInstance;
    group?: string;
    triggerOnEnd: boolean;
};

export class SoundManagerBase {
    currentSounds = [] as TSound[];
    extension: '.ogg' | '.m4a' = '.ogg';

    init() {
        this.extension = JsUtils.checkAndTellOggSupport(document) ? '.ogg' : '.m4a';
        GameSettings.subscribe('sound', () => {
            this.manageMusicSoundVolume();
            this.manageEffectsSoundVolume();
        });
    }

    /**
     * @returns Infinity for no sound found
     */
    getMinDurationFromStart(soundName: string) {
        const now = Date.now();
        const durations = this.currentSounds
            .filter((sound) => sound.soundName === soundName)
            .map((sound) => now - sound.startTimeMS);

        return Math.min(...durations);
    }

    checkThresholdAndPlay(config: TPlaySoundConfig, threshold = 200) {
        if (this.getMinDurationFromStart(config.soundName) > threshold) {
            this.play(config);
        }
    }

    play(config: TPlaySoundConfig) {
        if (!GameSettings.soundEnabled) return;
        if (this.extension !== '.ogg') return; // disables other extensions for time beeing
        const fullConfig = { loop: false, volume: 1, ...config };

        let assetPath = `${config.soundName}${this.extension}`;

        const pixiSound = PIXI.Assets.get(assetPath) as PIXI_SOUND.Sound;
        if (!pixiSound) {
            console.warn(assetPath, 'no available assetPath');
            return;
        }
        let instance = pixiSound.play({
            volume: fullConfig.volume,
            loop: fullConfig.loop,
        });

        if (instance instanceof Promise) {
            throw new Error(`sound asset has not been preloaded: ${config.soundName}`);
        }

        const sound = {
            instance,
            pixiSound,
            soundName: fullConfig.soundName,
            startTimeMS: Date.now(),
            volume: fullConfig.volume,
            group: fullConfig.group,
            triggerOnEnd: true,
            isFading: false,
            onEnd: config.onEnd,
        };

        this.currentSounds.push(sound);

        this.manageMusicSoundVolume();
        this.manageEffectsSoundVolume();
        if (sound.group === 'music') {
            instance.on('progress', (progress: number, duration: number) => {
                if (
                    !sound.isFading &&
                    sound.group === 'music' &&
                    duration - progress * duration < 4
                ) {
                    sound.isFading = true;
                    EffectsManager.value(sound.instance, {
                        fieldName: 'volume',
                        value: 0,
                        durationMS: 4000,
                    });
                }
            });
        }
        instance.on('end', async () => {
            const index = this.currentSounds.findIndex((s) => s === sound);
            this.currentSounds.splice(index, 1);
            if (sound?.onEnd && sound.triggerOnEnd) {
                sound.onEnd();
            }
        });
        return sound;
    }

    stop(sound: TSound) {
        sound.instance.stop();
    }

    stopGroup(group: string) {
        this.currentSounds
            .filter((sound) => sound.group === group)
            .forEach((sound) => sound.instance.stop());
    }

    async fadeOut(sound: TSound, durationMS: number) {
        await EffectsManager.value(sound.instance, { fieldName: 'volume', value: 0, durationMS });
        sound.instance.stop();
    }

    async fadeTo(sound: TSound, targetVolume: number, durationMS: number) {
        if (!GameSettings.musicEnabled && sound.group === 'music') {
            targetVolume = 0;
        }
        if (!GameSettings.effectsEnabled && sound.group === 'effects') {
            targetVolume = 0;
        }
        await EffectsManager.value(sound.instance, {
            fieldName: 'volume',
            value: targetVolume,
            durationMS,
        });
    }

    manageMusicSoundVolume() {
        const music = this.currentSounds.filter((sounds) => sounds.group === 'music');
        if (GameSettings.musicEnabled) {
            music.forEach((sound) => {
                sound.instance.volume = sound.volume * GameSettings.musicVolume;
            });
        } else {
            music.forEach((sound) => {
                sound.instance.volume = 0;
            });
        }
    }

    manageEffectsSoundVolume() {
        const effects = this.currentSounds.filter((sounds) => sounds.group === 'effects');
        if (GameSettings.effectsEnabled) {
            effects.forEach((sound) => {
                sound.instance.volume = sound.volume * GameSettings.effectsVolume;
            });
        } else {
            effects.forEach((sound) => {
                sound.instance.volume = 0;
            });
        }
    }
}

export const SoundManager = new SoundManagerBase();
