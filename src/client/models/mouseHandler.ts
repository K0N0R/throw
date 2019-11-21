import { IPos } from './../utils/model';
import { getNormalizedVector } from './../utils/vector';
import { Canvas } from './canvas';
import { Camera } from './camera';
export enum MouseClicks {
    Left = 1,
    Middle = 2,
    Right = 3
}

export class MouseHandler {
    private static browserMousePos: IPos = { x: 0, y: 0};
    private static mousePos: IPos = { x: 0, y: 0};
    private static pressed: any = {};
    private static mousedownHandlers: { click: MouseClicks, action: Function}[] = [];
    private static clickHandlers: { click: MouseClicks, action: Function}[] = [];
    public static bindEvents() {

        document.addEventListener('mousedown', (event: MouseEvent) => {
            this.pressed[event.which] = true;
        });

        document.addEventListener('mouseup', (event: MouseEvent) => {
            this.pressed[event.which] = false;
        });

        document.addEventListener('contextmenu', (event: MouseEvent) => {
            event.preventDefault();
        });

        document.addEventListener('click', (event: MouseEvent) => {
            this.clickHandlers.forEach(h => {
                if (event.which === h.click) {
                    h.action();
                }
            });
        });

        document.addEventListener('mousemove', (event: MouseEvent) => {
            this.browserMousePos = { x: event.x, y: event.y };
            this.updateMousePos();
        });
    }

    public static updateMousePos(): void {
        const canvasBoundingRect = Canvas.element.getBoundingClientRect();
        const canvasPosition = {x: canvasBoundingRect.left + Canvas.element.clientLeft, y: canvasBoundingRect.top + Canvas.element.clientTop };
        const newMousePos = { x: this.browserMousePos.x - canvasPosition.x + Camera.pos.x, y: this.browserMousePos.y - canvasPosition.y + Camera.pos.y };
        this.mousePos = newMousePos;
    }

    public static reactOnClicks(): void {
        this.mousedownHandlers.forEach(h => {
            if (this.pressed[h.click]) {
                h.action();
            }
        });
    }

    public static add(click: MouseClicks, action: Function, hold: boolean = false): (() => void) {
        if (hold) {
            this.mousedownHandlers.push({ click: click, action: action });
            const idx = this.clickHandlers.length - 1;
            return () => {
                this.clickHandlers.splice(idx, 1);
            };
        } else {
            this.clickHandlers.push({ click: click, action: action });
            const idx = this.clickHandlers.length - 1;
            return () => {
                this.clickHandlers.splice(idx, 1);
            };
        }
    }

    public static getMousePos(elementPos?: IPos): IPos {
        // if elementPos defined method returns mousePos translated by elementPos coordinates 
        if (elementPos) {
            return {
                x: this.mousePos.x - elementPos.x,
                y: this.mousePos.y - elementPos.y
            }
        }
        return this.mousePos;
    }

    public static getVectorToCursor(elementPos?: IPos): IPos {
        const mousePosTranslatedByElement = this.getMousePos(elementPos);
        return getNormalizedVector( { x: 0, y: 0 }, mousePosTranslatedByElement);
    }
}
