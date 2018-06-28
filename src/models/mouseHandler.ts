import { IPos } from './../utils/model';
import { nomalizeVector } from './../utils/vector';
import { Canvas } from './canvas';
export enum MouseClicks {
    Left = 1,
    Middle = 2,
    Right = 3
}

export class MouseHandler {
    private static mousePos: IPos = { x: 0, y: 0};
    private static mouseMoveVector: IPos = { x: 0, y: 0};
    private static pressed: any = {};
    private static mousedownHandlers: { click: MouseClicks, action: Function}[] = [];
    private static clickHandlers: { click: MouseClicks, action: Function}[] = [];
    public static bindEvents() {

        document.addEventListener('mousedown', (event: KeyboardEvent) => {
            this.pressed[event.which] = true;
        });

        document.addEventListener('mouseup', (event: MouseEvent) => {
            this.pressed[event.which] = false;
        });

        document.addEventListener('click', (event: MouseEvent) => {
            this.clickHandlers.forEach(h => {
                if (this.pressed[h.click]) {
                    h.action();
                }
            });
        });

        document.addEventListener('mousemove', (event: MouseEvent) => {
            const canvasBoundingRect = Canvas.ele.getBoundingClientRect();
            const canvasPosition = {x: canvasBoundingRect.left + Canvas.ele.clientLeft, y: canvasBoundingRect.top + Canvas.ele.clientTop };
            const newMousePos = { x: event.x - canvasPosition.x, y: event.y - canvasPosition.y };
            this.mouseMoveVector = nomalizeVector(this.mousePos, newMousePos);
            this.mousePos = newMousePos;
        });
    }

    public static reactOnKeys(): void {
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

    public static getElementToMousePosVector(elementPos?: IPos): IPos {
        const mousePosTranslatedByElement = this.getMousePos(elementPos);
        return nomalizeVector( { x: 0, y: 0 }, mousePosTranslatedByElement);
    }
}
