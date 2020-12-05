import { style_config, MapKind, map_config } from './../../shared/callibration';
import { IPos } from './../../shared/model';

import { Canvas } from './canvas';
import { POWERUP_KIND } from '../../shared/powerup';

export class Powerup {
    public pos: IPos;
    public kind!: POWERUP_KIND;
    public constructor(private mapKind: MapKind) {
        this.pos = {
            x: -1000,
            y: -1000
        };
    }

    public render(): void {
        if (!this.kind) return;
        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x, this.pos.y, map_config[this.mapKind].powerup.radius - style_config.powerup.lineWidth, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = style_config.powerup.fillStyle;
        Canvas.ctx.fill();
        Canvas.ctx.strokeStyle = style_config.powerup.strokeStyle;
        Canvas.ctx.lineWidth = style_config.powerup.lineWidth;
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}
