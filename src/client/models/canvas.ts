import { map_config, MapKind } from './../../shared/callibration'; 

export class Canvas {
    private static mapKind: MapKind;
    private static _element: HTMLCanvasElement;
    public static get element(): HTMLCanvasElement {
        return this._element;
    }

    private static _ctx: CanvasRenderingContext2D;
    public static get ctx(): CanvasRenderingContext2D  {
        return this._ctx;
    }

    public static createCanvas(mapKind: MapKind): void {
        this.mapKind = mapKind;
        this._element = document.createElement('canvas');
        this._element.width = map_config[mapKind].outerSize.width;
        this._element.height = map_config[mapKind].outerSize.height;
        const ctx = this.element.getContext("2d");
        if (ctx !== null) {
            this._ctx = ctx;
        }
        const element = document.querySelector('#game');
        if(!element) return;
            element.appendChild(this.element);
    }

    public static removeCanvas(): void {
        this._element.remove();
    }

    public static clearCanvas(): void {
        this.ctx.clearRect(0, 0, map_config[this.mapKind].outerSize.width, map_config[this.mapKind].outerSize.height);
    }

    public static startDraw(): void {
        this.ctx.beginPath();
    }

    public static stopDraw(): void {
        this.ctx.closePath();
    }
}

