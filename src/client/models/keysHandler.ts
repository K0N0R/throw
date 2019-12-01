export class KeysHandler {
    public static pressed: { [param: number]: boolean } = {};
    public static bindEvents(): void {
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            this.pressed[event.which] = true;
        });
        document.addEventListener('keyup', (event: KeyboardEvent) => {
            this.pressed[event.which] = false;
        });

    }
}