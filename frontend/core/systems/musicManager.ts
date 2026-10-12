import * as PIXI_SOUND from '@pixi/sound';
import { Bus } from './bus';
import { EffectsManager } from './effectManager';
import { SoundManager, TSound } from './soundManager';

export class MusicManagerBase {
    musicIndex = 0;
    gameplayMusics = [];
    lobbyMusic = [];

    currentMusic?: TSound;
    filter = new PIXI_SOUND.filters.EqualizerFilter();

    isPlayingRunMusic = false;
    isPlayingLobbyMusic = false;
    isFading = false;

    init() {
        this.bindEvents();
    }

    bindEvents() {
        Bus.subscribe(
            'state',
            (message) => {
                switch (message.name) {
                    case 'gameplay-start':
                        this.triggerGameplayMusicLoop();
                        break;
                    case 'lobby-start':
                        this.triggerLobbyMusicLoop();
                        break;
                }
            },
            this,
        );
    }

    public async triggerGameplayMusicLoop() {
        if (this.isPlayingLobbyMusic) {
            if (this.currentMusic?.group) {
                this.currentMusic.triggerOnEnd = false;
                await SoundManager.fadeOut(this.currentMusic, 1000);
                SoundManager.stopGroup(this.currentMusic.group);
            }
            this.isPlayingLobbyMusic = false;
        }
        if (this.isPlayingRunMusic) return;
        this.musicIndex = 0;
        this.isPlayingRunMusic = true;
        this.playRunMusicInLoop();
    }

    public async playRunMusicInLoop() {
        this.playRunMusic(this.gameplayMusics[this.musicIndex]);
    }

    async playRunMusic(music: string) {
        this.currentMusic = SoundManager.play({
            soundName: music,
            volume: 1,
            loop: false,
            group: 'music',
            onEnd: () => {
                this.musicIndex =
                    (this.musicIndex + 1) % this.gameplayMusics.length === 0
                        ? 0
                        : this.musicIndex + 1;
                this.playRunMusicInLoop();
            },
        });
    }

    public async triggerLobbyMusicLoop() {
        if (this.isPlayingRunMusic) {
            if (this.currentMusic?.group) {
                this.currentMusic.triggerOnEnd = false;
                await SoundManager.fadeOut(this.currentMusic, 1000);
                SoundManager.stopGroup(this.currentMusic.group);
            }
            this.isPlayingRunMusic = false;
        }
        if (this.isPlayingLobbyMusic) return;
        this.musicIndex = 0;
        this.isPlayingLobbyMusic = true;
        this.playLobbyMusicInLoop();
    }

    public async playLobbyMusicInLoop() {
        this.playLobbyMusic(this.lobbyMusic[this.musicIndex]);
    }

    async playLobbyMusic(music: string) {
        this.currentMusic = SoundManager.play({
            soundName: music,
            volume: 0.25,
            loop: false,
            group: 'music',
            onEnd: () => {
                this.musicIndex =
                    (this.musicIndex + 1) % this.lobbyMusic.length === 0 ? 0 : this.musicIndex + 1;
                this.playLobbyMusicInLoop();
            },
        });
    }

    async fadeInToiletOnMusic(way: 'in' | 'out') {
        const from = way === 'in' ? 0 : 1;
        const to = way === 'in' ? 1 : 0;
        const promise = EffectsManager.callback(
            this,
            { from, to, durationMS: 1000, group: 'ui' },
            (value) => {
                this.filter.f32 = value * 7;
                this.filter.f64 = value * 5;
                this.filter.f125 = value * 2;
                this.filter.f250 = value * -5;
                this.filter.f500 = value * -10;
                this.filter.f1k = value * -20;
                this.filter.f2k = value * -30;
                this.filter.f4k = value * -35;
                this.filter.f8k = value * -40;
                this.filter.f16k = value * -50;
            },
        );

        if (this.currentMusic) {
            if (way === 'in') {
                this.currentMusic.pixiSound.filters = [this.filter];
            } else {
                await promise;
                this.currentMusic.pixiSound.filters = [];
            }
        }
    }
}

export const MusicManager = new MusicManagerBase();
