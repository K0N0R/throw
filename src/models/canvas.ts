export class Canvas {
    public static ele: HTMLCanvasElement;
    public static ctx: CanvasRenderingContext2D;

    public static get width(): number {
        return this.ele.width;
    }

    public static set width(value: number) {
        this.ele.width = value;
    }

    public static get height(): number {
        return this.ele.width;
    }

    public static set height(value: number) {
        this.ele.height = value;
    }

    public static createCanvas(): void {
        this.ele = document.createElement('canvas');
        this.ctx = this.ele.getContext("2d");
        document.body.appendChild(this.ele);
    }

    public static clearCanvas(): void {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    public static startDraw(): void {
        this.ctx.beginPath();
    }

    public static stopDraw(): void {
        this.ctx.closePath();
    }
}

