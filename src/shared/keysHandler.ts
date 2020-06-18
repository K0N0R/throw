export class KeysHandler {
    private static pressed: { [param: number]: boolean } = {};
    private static handler: (pressed: { [param: number]: boolean }) => void;
    public static bindEvents(handler: (pressed: { [param: number]: boolean }) => void) {
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            this.pressed[event.which] = true;
        });
        document.addEventListener('keyup', (event: KeyboardEvent) => {
            this.pressed[event.which] = false;
        });

        this.handler = handler;
    }

    public static run(): void {
        this.handler({...this.pressed});
    }
}