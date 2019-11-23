import { IPos } from './../../shared/model';
import { getOffset } from './../../shared/offset';
import { getCornerPoints } from './../../shared/vertices';
import { map, goal, canvas } from './../../shared/callibration';

import { Canvas } from './canvas';

export class Map {
    public pos: IPos;
    public outerPos: IPos;

    public constructor() {

        this.pos = {
            x: canvas.size.width / 2 - map.size.width / 2,
            y: canvas.size.height / 2 - map.size.height / 2
        };

        this.outerPos = {
            x: this.pos.x - map.border,
            y: this.pos.y - map.border
        };

    }

    private getTopShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, map.size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.left, offset.midVert - goal.size.height / 2],
            [offset.left, offset.top + map.cornerRadius],
            ...getCornerPoints(map.cornerPointsAmount, Math.PI, { x: offset.left + map.cornerRadius, y: offset.top + map.cornerRadius }, map.cornerRadius),
            [offset.left + map.cornerRadius, offset.top],
            [offset.right - map.cornerRadius, offset.top],
            ...getCornerPoints(map.cornerPointsAmount, Math.PI + Math.PI / 2, { x: offset.right - map.cornerRadius, y: offset.top + map.cornerRadius }, map.cornerRadius),
            [offset.right, offset.top + map.cornerRadius],
            [offset.right, offset.midVert - goal.size.height / 2],

            [offset.right + mapTickness, offset.midVert - goal.size.height / 2], // obramówka zewnętrzna
            [offset.right + mapTickness, offset.top - mapTickness],
            [offset.left - mapTickness, offset.top - mapTickness],
            [offset.left - mapTickness, offset.midVert - goal.size.height / 2],
        ];
    }

    private getBottomShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, map.size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.right, offset.midVert + goal.size.height / 2],
            [offset.right, offset.bottom - map.cornerRadius],
            ...getCornerPoints(map.cornerPointsAmount, 0, { x: offset.right - map.cornerRadius, y: offset.bottom - map.cornerRadius }, map.cornerRadius),
            [offset.right - map.cornerRadius, offset.bottom],
            [offset.left + map.cornerRadius, offset.bottom],
            ...getCornerPoints(map.cornerPointsAmount, Math.PI / 2, { x: offset.left + map.cornerRadius, y: offset.bottom - map.cornerRadius }, map.cornerRadius),
            [offset.left, offset.bottom - map.cornerRadius],
            [offset.left, offset.midVert + goal.size.height / 2],

            [offset.left - mapTickness, offset.midVert + goal.size.height / 2],// obramówka zewnętrzna
            [offset.left - mapTickness, offset.bottom + mapTickness],
            [offset.right + mapTickness, offset.bottom + mapTickness],
            [offset.right + mapTickness, offset.midVert + goal.size.height / 2],
        ];
    }

    public render(): void {
        Canvas.startDraw();
        const verticesTop = this.getTopShapePoints(this.pos);
        Canvas.ctx.moveTo(verticesTop[0][0], verticesTop[0][1]);
        verticesTop
            .filter((_, idx) => idx < verticesTop.length - 4) // skip 4 last
            .forEach(v => {
                Canvas.ctx.lineTo(v[0], v[1]);
            });
        Canvas.ctx.lineWidth = 3;
        Canvas.ctx.strokeStyle = 'white';
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        Canvas.startDraw();
        const verticesBottom = this.getBottomShapePoints(this.pos);
        Canvas.ctx.moveTo(verticesBottom[0][0], verticesBottom[0][1]);
        verticesBottom
            .filter((_, idx) => idx < verticesBottom.length - 4) // skip 4 last
            .forEach(v => {
                Canvas.ctx.lineTo(v[0], v[1]);
            });
        Canvas.ctx.lineWidth = 3;
        Canvas.ctx.strokeStyle = 'white';
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}