export enum Keys {
    Left = 37,
    Up = 38,
    Right = 39,
    Down = 40,
    W = 87,
    S = 83,
    A = 65,
    D = 68,
    X = 88,
    Shift = 16,
    C = 67
    
}

export class KeysHandler {
    private static pressed: any = {};
    public static handlers: { key: Keys, action: Function }[] = [];
    public static bindEvents() {
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            this.pressed[event.which] = true;
        });
        document.addEventListener('keyup', (event: KeyboardEvent) => {
            this.pressed[event.which] = false;
        });
    }

    public static reactOnKeys() {
        this.handlers.forEach(h => {
            h.action(this.pressed[h.key]);
        });
    }

    public static add(key: Keys, action: Function): (() => void) {
        this.handlers.push({ key: key, action: action });
        const idx = this.handlers.length - 1;
        return () => {
            this.handlers.splice(idx, 1);
        };
    }
}