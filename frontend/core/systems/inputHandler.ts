import { Bus } from './bus';

const defaultKeysConfiguration = {
    PAUSE: 'escape',
};

export type TInputKeys = keyof typeof defaultKeysConfiguration;

export class InputHandlerBase {
    keyConfiguration = defaultKeysConfiguration;
    pressedKeys = new Set<string>();

    isKeyPressed(key: keyof typeof defaultKeysConfiguration) {
        return this.pressedKeys.has(this.keyConfiguration[key]);
    }

    hasAnyKeyPressed() {
        return this.pressedKeys.size !== 0;
    }

    init() {
        window.onbeforeunload = (e: BeforeUnloadEvent) => {
            // uncomment for production
            if (DEBUG) {
                return;
            }
            e.preventDefault();
            e.returnValue = 'Really want to quit the game?';
        };

        // focus change
        const clearKeys = () => {
            for (const key in this.pressedKeys) {
                Bus.emit('input', { name: 'keyup', data: key.toLowerCase() });
            }
            this.pressedKeys.clear();
        };
        const onVisibilityChange = () => {
            clearKeys();
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        const onWindowBlur = () => {
            clearKeys();
        };
        window.addEventListener('blur', onWindowBlur);

        this.initKeyboardEvents();
        this.initMouseEvents();
        this.initTouchEvents();
    }

    initKeyboardEvents() {
        const onKeyDown = (evt: KeyboardEvent) => {
            Bus.emit('input', { name: 'keydown', data: evt.key.toLowerCase() });
            this.pressedKeys.add(evt.key.toLowerCase());
        };
        window.addEventListener('keydown', onKeyDown);

        const onKeyUp = (evt: KeyboardEvent) => {
            this.pressedKeys.delete(evt.key.toLowerCase());
            Bus.emit('input', { name: 'keyup', data: evt.key.toLowerCase() });
        };
        window.addEventListener('keyup', onKeyUp);
    }

    initMouseEvents() {
        const onMouseMove = (evt: MouseEvent) => {
            Bus.emit('input', { name: 'pointermove', data: { x: evt.clientX, y: evt.clientY } });
        };
        const onMouseDown = (evt: MouseEvent) => {
            if (evt.button === 0) {
                Bus.emit('input', { name: 'pointerdown', data: true });
            }
            if (evt.button === 2) {
                Bus.emit('input', { name: 'contextmenu', data: true });
            }
        };
        const onMouseUp = (evt: MouseEvent) => {
            if (evt.button === 0) {
                Bus.emit('input', { name: 'pointerdown', data: false });
            }
            if (evt.button === 2) {
                Bus.emit('input', { name: 'contextmenu', data: false });
            }
        };
        const onMouseLeave = (evt: MouseEvent) => {
            Bus.emit('input', { name: 'pointerdown', data: false });
        };

        const onMouseWheel = (evt: WheelEvent) => {
            Bus.emit('input', { name: 'wheel', data: evt.deltaY });
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseleave', onMouseLeave);
        window.addEventListener('wheel', onMouseWheel);
    }

    initTouchEvents() {
        const onTouchStart = (evt: TouchEvent) => {
            Bus.emit('input', {
                name: 'pointermove',
                data: { x: evt.touches[0].clientX, y: evt.touches[0].clientY },
            });
            Bus.emit('input', { name: 'pointerdown', data: true });
        };
        const onTouchMove = (evt: TouchEvent) => {
            Bus.emit('input', {
                name: 'pointermove',
                data: { x: evt.touches[0].clientX, y: evt.touches[0].clientY },
            });
        };
        const onTouchEnd = (evt: TouchEvent) => {
            Bus.emit('input', { name: 'pointerdown', data: false });
        };

        document.addEventListener('touchstart', onTouchStart);
        document.addEventListener('touchmove', onTouchMove);
        document.addEventListener('touchend', onTouchEnd);
    }
}

export const InputHandler = new InputHandlerBase();
