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
    private static pressed: { [param: number]: boolean } = {};
    private static handler: (pressed: { [param: number]: boolean }) => void;
    public static bindEvents(handler: (pressed: { [param: number]: boolean }) => void) {
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            this.pressed[event.which] = true;
            this.change = true;
        });
        document.addEventListener('keyup', (event: KeyboardEvent) => {
            this.pressed[event.which] = false;
            this.change = true;
        });

        this.handler = handler;

    }

    public static reactOnPressChange() {
        this.handler(this.pressed);
    }
}