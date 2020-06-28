import { IPos } from './../../shared/model';
import { IOffset, getOffset } from './../../shared/offset';
import { map_config, MapKind } from './../../shared/callibration';

import { Canvas } from './canvas';
import { getNormalizedVector, getDistance } from './../../shared/vector';

export class Camera {
    private static mapKind: MapKind;
    private static offset: IOffset;
    public static pos: IPos;

    public static init(mapKind: MapKind): void {
        this.mapKind = mapKind;
        this.offset = getOffset({ x: 0, y: 0 }, map_config[this.mapKind].outerSize);
    }

    public static updatePos(pos1: IPos, pos2: IPos) {
        const vector = getNormalizedVector(pos1, pos2);
        const distance = getDistance(pos1, pos2);
        const pos = {
            x: pos1.x + (vector.x * distance/2),
            y: pos1.y + (vector.y * distance/2)
        }
        const newPos = {
            x: pos.x - Canvas.canvasSize.width / 2,
            y: pos.y - Canvas.canvasSize.height / 2
        };
        if (Canvas.canvasSize.width < map_config[this.mapKind].outerSize.width) {
            if (newPos.x < this.offset.left) {
                newPos.x = this.offset.left;
            }
            if (newPos.x > this.offset.right - Canvas.canvasSize.width) {
                newPos.x = this.offset.right - Canvas.canvasSize.width;
            }
        } else {
            newPos.x = (Canvas.canvasSize.width - map_config[this.mapKind].outerSize.width)/-2
        }
        if (Canvas.canvasSize.height < map_config[this.mapKind].outerSize.height) {
            if (newPos.y < this.offset.top) {
                newPos.y = this.offset.top;
            }
            if (newPos.y > this.offset.bottom - Canvas.canvasSize.height) {
                newPos.y = this.offset.bottom - Canvas.canvasSize.height;
            }
        } else {
            newPos.y = (Canvas.canvasSize.height - map_config[this.mapKind].outerSize.height)/-2
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