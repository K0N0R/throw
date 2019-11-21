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
    public static pressed: { [param: number]: boolean } = {};
    public static handlers: { key: Keys, action: Function }[] = [];
    public static handlersForAll: Function[] = [];
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

        this.handlersForAll.forEach(action => {
            action();
        });

    }

    public static addAll(action: Function): (() => void) {
        this.handlersForAll.push(action);
        const idx = this.handlersForAll.length - 1;
        return () => {
            this.handlersForAll.splice(idx, 1);
        };
    }

    public static add(key: Keys, action: Function): (() => void) {
        this.handlers.push({ key: key, action: action });
        const idx = this.handlers.length - 1;
        return () => {
            this.handlers.splice(idx, 1);
        };
    }
}