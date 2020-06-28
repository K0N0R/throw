export interface KeysMap {
    up?: boolean;
    down?: boolean;
    left?: boolean;
    right?: boolean;
    shoot?: boolean;
    dash?: boolean;
}

export interface KeysConfiguration {
    up: string;
    down: string;
    left: string;
    right: string;
    shoot: string;
    dash: string;
}

export class KeysHandler {
    public static configuration: KeysConfiguration;

    public static defaultConfiguration: KeysConfiguration = {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight',
        shoot: 'KeyX',
        dash: 'ShiftLeft'
    };

    public static keyMap: KeysMap = {};

    public static setConfiguration(): void {
        const config = window.localStorage.getItem('throw_config');
        this.configuration = config ? JSON.parse(config) : this.defaultConfiguration;
    }

    public static init(): void {
        this.setConfiguration();

        document.addEventListener('keydown', (event: KeyboardEvent) => {
            for (let key in this.configuration) {
                if (this.configuration[key] === event.code) {
                    this.keyMap[key] = true;
                }
            }
        });
        document.addEventListener('keyup', (event: KeyboardEvent) => {
            for (let key in this.configuration) {
                if (this.configuration[key] === event.code) {
                    this.keyMap[key] = false;
                }
            }
        });
    }

    private static handler: ((pressed: KeysMap) => void) | null;
    public static bindHandler(handler: (pressed: KeysMap) => void) {
        this.handler = handler;
    }

    public static clearHandler(): void {
        this.handler = null;
    }

    public static run(): void {
        if (this.handler) this.handler({...this.keyMap});
    }
}

KeysHandler.init();