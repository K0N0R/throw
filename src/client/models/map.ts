import { IPos } from './../../shared/model';
import { getOffset } from './../../shared/offset';
import { getCornerPoints } from './../../shared/vertices';
import { map_config, map_style, goal_config, canvas_config } from './../../shared/callibration';

import { Canvas } from './canvas';

export class Map {
    public pos: IPos;
    public outerPos: IPos;

    public constructor() {

        this.pos = {
            x: canvas_config.size.width / 2 - map_config.size.width / 2,
            y: canvas_config.size.height / 2 - map_config.size.height / 2
        };

        this.outerPos = {
            x: this.pos.x - map_config.border,
            y: this.pos.y - map_config.border
        };

    }

    private getTopShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, map_config.size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.left, offset.midVert - goal_config.size.height / 2],
            [offset.left, offset.top + map_config.cornerRadius],
            ...getCornerPoints(map_config.cornerPointsAmount, Math.PI, { x: offset.left + map_config.cornerRadius, y: offset.top + map_config.cornerRadius }, map_config.cornerRadius),
            [offset.left + map_config.cornerRadius, offset.top],
            [offset.right - map_config.cornerRadius, offset.top],
            ...getCornerPoints(map_config.cornerPointsAmount, Math.PI + Math.PI / 2, { x: offset.right - map_config.cornerRadius, y: offset.top + map_config.cornerRadius }, map_config.cornerRadius),
            [offset.right, offset.top + map_config.cornerRadius],
            [offset.right, offset.midVert - goal_config.size.height / 2],

            [offset.right + mapTickness, offset.midVert - goal_config.size.height / 2], // obramówka zewnętrzna
            [offset.right + mapTickness, offset.top - mapTickness],
            [offset.left - mapTickness, offset.top - mapTickness],
            [offset.left - mapTickness, offset.midVert - goal_config.size.height / 2],
        ];
    }

    private getBottomShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, map_config.size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.right, offset.midVert + goal_config.size.height / 2],
            [offset.right, offset.bottom - map_config.cornerRadius],
            ...getCornerPoints(map_config.cornerPointsAmount, 0, { x: offset.right - map_config.cornerRadius, y: offset.bottom - map_config.cornerRadius }, map_config.cornerRadius),
            [offset.right - map_config.cornerRadius, offset.bottom],
            [offset.left + map_config.cornerRadius, offset.bottom],
            ...getCornerPoints(map_config.cornerPointsAmount, Math.PI / 2, { x: offset.left + map_config.cornerRadius, y: offset.bottom - map_config.cornerRadius }, map_config.cornerRadius),
            [offset.left, offset.bottom - map_config.cornerRadius],
            [offset.left, offset.midVert + goal_config.size.height / 2],

            [offset.left - mapTickness, offset.midVert + goal_config.size.height / 2],// obramówka zewnętrzna
            [offset.left - mapTickness, offset.bottom + mapTickness],
            [offset.right + mapTickness, offset.bottom + mapTickness],
            [offset.right + mapTickness, offset.midVert + goal_config.size.height / 2],
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
        Canvas.ctx.lineWidth = map_style.lineWidth;
        Canvas.ctx.strokeStyle = map_style.strokeStyle;
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
        Canvas.ctx.lineWidth = map_style.lineWidth;
        Canvas.ctx.strokeStyle = map_style.strokeStyle;
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        // left goal line
        Canvas.startDraw(); 
        Canvas.ctx.moveTo(this.pos.x, this.pos.y + map_config.size.height / 2 - goal_config.size.height / 2);
        Canvas.ctx.lineTo(this.pos.x, this.pos.y + map_config.size.height / 2 + goal_config.size.height / 2);
        Canvas.ctx.lineWidth = map_style.lineWidth;
        Canvas.ctx.strokeStyle = map_style.strokeStyle;
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        // right goal line
        Canvas.startDraw(); 
        Canvas.ctx.moveTo(this.pos.x + map_config.size.width, this.pos.y + map_config.size.height / 2 - goal_config.size.height / 2);
        Canvas.ctx.lineTo(this.pos.x + map_config.size.width, this.pos.y + map_config.size.height / 2 + goal_config.size.height / 2);
        Canvas.ctx.lineWidth = map_style.lineWidth;
        Canvas.ctx.strokeStyle = map_style.strokeStyle;
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        // middle line
        Canvas.startDraw(); 
        Canvas.ctx.moveTo(this.pos.x + map_config.size.width / 2, this.pos.y);
        Canvas.ctx.lineTo(this.pos.x + map_config.size.width / 2, this.pos.y + map_config.size.height);
        Canvas.ctx.lineWidth = map_style.lineWidth;
        Canvas.ctx.strokeStyle = map_style.strokeStyle;
        Canvas.ctx.stroke();
        Canvas.stopDraw();

         // middle circle
        Canvas.ctx.moveTo(this.pos.x + map_config.size.width / 2, this.pos.y + map_config.size.height / 2);
        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x + map_config.size.width / 2, this.pos.y + map_config.size.height / 2, map_config.middleRadius + (map_style.lineWidth/2), 0, Math.PI * 2);
        Canvas.ctx.lineWidth = map_style.lineWidth;
        Canvas.ctx.strokeStyle = map_style.strokeStyle;
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}