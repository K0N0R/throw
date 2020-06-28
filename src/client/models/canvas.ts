import { game_config, CameraKind } from './../../shared/callibration';
import { ISize } from './../../shared/model';

export class Canvas {
    private static _element: HTMLCanvasElement;
    public static get element(): HTMLCanvasElement {
        return this._element;
    }

    private static _ctx: CanvasRenderingContext2D;
    public static get ctx(): CanvasRenderingContext2D {
        return this._ctx;
    }

    public static canvasSize: ISize;
    public static changeCamera(cameraKind: CameraKind): void {
        this.canvasSize = game_config.camera[cameraKind];
        this._element.width = this.canvasSize.width;
        this._element.height = this.canvasSize.height;
        window.localStorage.setItem('throw_camera', cameraKind);
    }

    public static createCanvas(): void {
        this._element = document.createElement('canvas');
        const cameraKind: CameraKind = window.localStorage.getItem('throw_camera') as CameraKind || CameraKind.Medium;
        this.changeCamera(cameraKind);
        const ctx = this.element.getContext("2d");
        if (ctx !== null) {
            this._ctx = ctx;
        }
        const element = document.querySelector('#game');
        if (!element) return;
        element.appendChild(this.element);

    }

    public static removeCanvas(): void {
        this._element.remove();
    }

    public static clearCanvas(): void {
        this.ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
    }

    public static startDraw(): void {
        this.ctx.beginPath();
    }

    public static stopDraw(): void {
        this.ctx.closePath();
    }
}

