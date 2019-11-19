import { canvas } from './callibration'; 

export class Canvas {

    private static _element: HTMLCanvasElement;
    public static get element(): HTMLCanvasElement {
        return this._element;
    }

    private static _ctx: CanvasRenderingContext2D;
    public static get ctx(): CanvasRenderingContext2D  {
        return this._ctx;
    }

    public static createCanvas(): void {
        this._element = document.createElement('canvas');  
        this._element.width = canvas.size.width;
        this._element.height = canvas.size.height;
        this._ctx = this.element.getContext("2d");
        document.body.appendChild(this.element);
    }


    public static clearCanvas(): void {
        this.ctx.clearRect(0, 0, canvas.size.width, canvas.size.height);
    }

    public static startDraw(): void {
        this.ctx.beginPath();
    }

    public static stopDraw(): void {
        this.ctx.closePath();
    }
}

