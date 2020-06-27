import { IPos } from './../../shared/model';
import { IOffset, getOffset } from './../../shared/offset';
import { map_config, MapKind } from './../../shared/callibration';

import { Canvas } from './canvas';

export class Camera {
    private static mapKind: MapKind;
    private static offset: IOffset;
    public static pos: IPos;

    public static init(mapKind: MapKind): void {
        this.mapKind = mapKind;
        this.offset = getOffset({x: 0, y: 0}, map_config[this.mapKind].outerSize);
    }

    public static updatePos(pos: IPos) {
        const newPos = {
            x: pos.x -  map_config[this.mapKind].outerSize.width/2,
            y: pos.y - map_config[this.mapKind].outerSize.height/2
        };
        if (newPos.x < this.offset.left) {
            newPos.x = this.offset.left;
        }
        if (newPos.x > this.offset.right - map_config[this.mapKind].outerSize.width) {
            newPos.x = this.offset.right - map_config[this.mapKind].outerSize.width;
        }
        if (newPos.y < this.offset.top) {
            newPos.y = this.offset.top;
        }
        if (newPos.y > this.offset.bottom - map_config[this.mapKind].outerSize.height) {
            newPos.y = this.offset.bottom - map_config[this.mapKind].outerSize.height;
        }
        this.pos = newPos;
    }

    public static translateStart() {
        if (this.pos) {
            Canvas.ctx.save();
            Canvas.ctx.translate(-this.pos.x, -this.pos.y);
        }
    }

    public static translateEnd() {
        if (this.pos) {
            Canvas.ctx.restore()
        }
    }
}