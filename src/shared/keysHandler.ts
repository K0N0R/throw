export class KeysHandler {
    private static pressed: { [param: number]: boolean } = {};
    public static init(): void {
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            this.pressed[event.which] = true;
        });
        document.addEventListener('keyup', (event: KeyboardEvent) => {
            this.pressed[event.which] = false;
        });
    }

    private static handler: ((pressed: { [param: number]: boolean }) => void) | null;
    public static bindHandler(handler: (pressed: { [param: number]: boolean }) => void) {
        this.handler = handler;
    }

    public static clearHandler(): void {
        this.handler = null;
    }

    public static run(): void {
        if (this.handler) this.handler({...this.pressed});
    }
}

KeysHandler.init();