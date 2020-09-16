import { IPos } from './../utils/model';
import { getNormalizedVector } from './../utils/vector';
import { Canvas } from './canvas';
export class MouseHandler {
    private static browserMousePos: IPos = { x: 0, y: 0};
    private static mousePos: IPos = { x: 0, y: 0};
    public static bindEvents() {
        document.addEventListener('mousemove', (event: MouseEvent) => {
            this.browserMousePos = { x: event.x, y: event.y };
            this.updateMousePos();
        });
    }

    public static updateMousePos(): void {
        const canvasBoundingRect = Canvas.ele.getBoundingClientRect();
        const canvasPosition = {x: canvasBoundingRect.left + Canvas.ele.clientLeft, y: canvasBoundingRect.top + Canvas.ele.clientTop };
        const newMousePos = { x: this.browserMousePos.x - canvasPosition.x, y: this.browserMousePos.y - canvasPosition.y };
        this.mousePos = newMousePos;
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
