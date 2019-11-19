import { ISize } from './../utils/model';

export class Canvas {

    private static _element: HTMLCanvasElement;
    public static get element(): HTMLCanvasElement {
        return this._element;
    }

    private static _ctx: CanvasRenderingContext2D;
    public static get ctx(): CanvasRenderingContext2D  {
        return this._ctx;
    }
    
    private static _size: ISize;
    public static get size(): ISize {
        return this._size;
    }

    public static createCanvas(size: ISize): void {
        this._size = size;
        this._element = document.createElement('canvas');  
        this._element.width = this._size.width;
        this._element.height = this._size.height;
        this._ctx = this.element.getContext("2d");
        document.body.appendChild(this.element);
    }


    public static clearCanvas(): void {
        this.ctx.clearRect(0, 0, this.size.width, this.size.height);
    }

    public static startDraw(): void {
        this.ctx.beginPath();
    }

    public static stopDraw(): void {
        this.ctx.closePath();
    }
}

