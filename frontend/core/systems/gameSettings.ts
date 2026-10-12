type TGameSettingsSubscribe = 'sound';

export class GameSettings {
    static storageKey = 'SETTINGS';
    static version = 0;

    static soundEnabled = true;

    static _musicEnabled = false;
    static get musicEnabled() {
        return this._musicEnabled;
    }

    static set musicEnabled(value: boolean) {
        this._musicEnabled = value;
        this.notify('sound');
        this.saveSettings();
    }

    static _musicVolume = 0;
    static get musicVolume() {
        return this._musicVolume;
    }

    static set musicVolume(value: number) {
        this._musicVolume = value;
        this.musicEnabled = this._musicVolume > 0;
        this.notify('sound');
        this.saveSettings();
    }

    static _effectsEnabled = false;
    static get effectsEnabled() {
        return this._effectsEnabled;
    }

    static set effectsEnabled(value: boolean) {
        this._effectsEnabled = value;
        this.notify('sound');
        this.saveSettings();
    }

    static _effectsVolume = 0;
    static get effectsVolume() {
        return this._effectsVolume;
    }

    static set effectsVolume(value: number) {
        this._effectsVolume = value;
        this.effectsEnabled = this._effectsVolume > 0;
        this.notify('sound');
        this.saveSettings();
    }

    static init() {
        this.retriveSettings();
    }

    static subscribers: { event: TGameSettingsSubscribe; callback: () => void }[] = [];

    static subscribe(event: TGameSettingsSubscribe, callback: () => void) {
        this.subscribers.push({ event, callback });
    }

    static notify(event: TGameSettingsSubscribe) {
        this.subscribers
            .filter((s) => s.event === event)
            .forEach((s) => {
                s.callback();
            });
    }

    static retriveSettings() {
        const json = localStorage.getItem(this.storageKey);
        if (!json) return;
        const settings = JSON.parse(json);
        if (settings.version !== this.version) {
            localStorage.removeItem(this.storageKey);
            return;
        }

        this._musicEnabled = settings.musicEnabled;
        this._musicVolume = settings.musicVolume;
        this._effectsEnabled = settings.effectsEnabled;
        this._effectsVolume = settings.effectsVolume;
    }

    static saveSettings() {
        localStorage.setItem(
            this.storageKey,
            JSON.stringify({
                musicEnabled: this.musicEnabled,
                musicVolume: this.musicVolume,
                effectsEnabled: this.effectsEnabled,
                effectsVolume: this.effectsVolume,
                version: this.version,
            }),
        );
    }
}
