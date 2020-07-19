import { style_config, MapKind, map_config } from './../../shared/callibration';
import { IPos } from './../../shared/model';

import { Canvas } from './canvas';

export class Ball {
    public pos: IPos;
    public constructor(private mapKind: MapKind) {
        this.pos = {
            x: map_config[this.mapKind].outerSize.width / 2,
            y: map_config[this.mapKind].outerSize.height / 2
        };
    }

    public render(): void {
        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x, this.pos.y, map_config[this.mapKind].ball.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = style_config.ball.fillStyle;
        Canvas.ctx.fill();
        Canvas.ctx.strokeStyle = style_config.ball.strokeStyle;
        Canvas.ctx.lineWidth = style_config.ball.lineWidth;
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}
