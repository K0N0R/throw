import { canvas_config } from './../../shared/callibration'; 

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
        this._element.width = canvas_config.size.width;
        this._element.height = canvas_config.size.height;
        const ctx = this.element.getContext("2d");
        if (ctx !== null) {
            this._ctx = ctx;
        }
        const element = document.querySelector('#game');
        if(!element) return;
            element.appendChild(this.element);
    }


    public static clearCanvas(): void {
        this.ctx.clearRect(0, 0, canvas_config.size.width, canvas_config.size.height);
    }

    public static startDraw(): void {
        this.ctx.beginPath();
    }

    public static stopDraw(): void {
        this.ctx.closePath();
    }
}

