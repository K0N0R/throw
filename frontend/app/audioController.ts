import { sound } from '@pixi/sound';
import type { RoomState } from '../../shared/game/lobbyProtocol';
import { RoomSoundEvents } from '../game/soundEvents';
import { GameSettings } from '../core/systems/gameSettings';
import { SoundManager, type TSound } from '../core/systems/soundManager';
import { node } from '../lobby/dom';

export class AudioController {
    private readonly events = new RoomSoundEvents();
    private ambient?: TSound;

    constructor(root: HTMLElement) {
        const controls = node('details', 'audio-controls');
        const summary = node('summary');
        summary.title = 'Ustawienia dzwieku';
        summary.setAttribute('aria-label', 'Ustawienia dzwieku');
        const icon = node('img');
        icon.src = 'assets/sound-enabled.png';
        icon.alt = '';
        icon.width = icon.height = 24;
        summary.append(icon);
        const panel = node('div', 'audio-panel');
        for (const [kind, title] of [
            ['effects', 'Efekty'],
            ['music', 'Ambient'],
        ] as const) {
            const label = node('label', 'audio-option', title);
            const slider = node('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '100';
            slider.value = String(
                Math.round(
                    (kind === 'music'
                        ? GameSettings.musicEnabled
                            ? GameSettings.musicVolume
                            : 0
                        : GameSettings.effectsEnabled
                          ? GameSettings.effectsVolume
                          : 0) * 100,
                ),
            );
            slider.setAttribute('aria-label', title);
            slider.oninput = () => {
                const volume = Number(slider.value) / 100;
                if (kind === 'music') GameSettings.musicVolume = volume;
                else GameSettings.effectsVolume = volume;
                this.updateIcon(icon);
            };
            label.append(slider);
            panel.append(label);
        }
        controls.append(summary, panel);
        root.append(controls);
        this.updateIcon(icon);
        document.addEventListener('click', (event) => {
            if (event.target instanceof Element && event.target.closest('button:not(:disabled)'))
                SoundManager.effect('ui-confirm', 0.25);
        });
        document.addEventListener(
            'toggle',
            (event) => {
                if (event.target instanceof HTMLDetailsElement)
                    SoundManager.effect(event.target.open ? 'ui-open' : 'ui-close', 0.25);
            },
            true,
        );
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) sound.pauseAll();
            else sound.resumeAll();
        });
        window.addEventListener('pagehide', () => {
            SoundManager.stopGroup('music');
            SoundManager.stopGroup('effects');
        });
    }

    private updateIcon(icon: HTMLImageElement) {
        icon.src = `assets/sound-${GameSettings.effectsEnabled || GameSettings.musicEnabled ? 'enabled' : 'disabled'}.png`;
    }

    room(room: RoomState | null, nick: string, connected: boolean) {
        if (connected) {
            const cues = this.events.update(room, nick);
            if (!document.hidden) cues.forEach((name) => SoundManager.effect(name));
        }
        this.playing(connected && !!room?.running);
    }

    playing(active: boolean) {
        if (!active && this.ambient) {
            SoundManager.stop(this.ambient);
            this.ambient = undefined;
        } else if (active && !this.ambient) {
            this.ambient = SoundManager.play({
                soundName: 'sounds/match-ambient.mp3',
                group: 'music',
                loop: true,
                volume: 0.6,
            });
        }
    }
}
