import { IPos } from './../../shared/model';
import { getCornerPoints } from './../../shared/vertices';
import { getOffset } from './../../shared/offset';
import { style_config, map_config, MapKind } from './../../shared/callibration';

import { Canvas } from './canvas';

export class RightGoal {
    private pos: IPos;
    private topPostPosition: IPos;
    private bottomPostPosition: IPos;

    public constructor(private mapKind: MapKind) {
        this.pos = { x: map_config[this.mapKind].outerSize.width - map_config[this.mapKind].border.side, y: (map_config[this.mapKind].outerSize.height / 2) - (map_config[this.mapKind].goal.size.height / 2) };
        this.topPostPosition = { x: this.pos.x, y: this.pos.y };
        this.bottomPostPosition = { x: this.pos.x, y: this.pos.y + map_config[this.mapKind].goal.size.height };
        this.points = this.getPoints(this.pos);
    }

    private points: ([number, number])[];
    private getPoints(pos = { x: 0, y: 0 }): ([number, number])[] {
        const offset = getOffset(pos, map_config[this.mapKind].goal.size)
        const goalTickness = 10;
        return [
            [offset.left, offset.bottom],
            [offset.right - map_config[this.mapKind].goal.cornerRadius, offset.bottom],
            ...getCornerPoints(map_config[this.mapKind].goal.cornerPointsAmount, Math.PI / 2, { x: offset.right - map_config[this.mapKind].goal.cornerRadius, y: offset.bottom - map_config[this.mapKind].goal.cornerRadius }, map_config[this.mapKind].goal.cornerRadius, {clockWise: -1}),
            [offset.right, offset.bottom - map_config[this.mapKind].goal.cornerRadius],
            [offset.right, offset.top + map_config[this.mapKind].goal.cornerRadius],
            ...getCornerPoints(map_config[this.mapKind].goal.cornerPointsAmount, 0, { x: offset.right - map_config[this.mapKind].goal.cornerRadius, y: offset.top + map_config[this.mapKind].goal.cornerRadius }, map_config[this.mapKind].goal.cornerRadius, {clockWise: -1}),
            [offset.right - map_config[this.mapKind].goal.cornerRadius, offset.top],
            [offset.left, offset.top],
            [offset.left, offset.top - goalTickness],
            [offset.right + goalTickness, offset.top - goalTickness],
            [offset.right + goalTickness, offset.bottom + goalTickness],
            [offset.left, offset.bottom + goalTickness],
        ]
    }

    public render(): void {
        Canvas.startDraw();
        const vertices = this.points;
        Canvas.ctx.moveTo(vertices[0][0], vertices[0][1]);
        vertices
            .filter((_, idx) => idx < vertices.length - 4) // skip 4 last
            .forEach(v => {
                Canvas.ctx.lineTo(v[0], v[1]);
            });
        Canvas.ctx.lineWidth = style_config.goal.lineWidth;
        Canvas.ctx.strokeStyle = style_config.goal.strokeStyle;
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        Canvas.startDraw();
        Canvas.ctx.arc(this.topPostPosition.x, this.topPostPosition.y, map_config[this.mapKind].goal.postRadius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = style_config.goal.rightPostFillStyle;
        Canvas.ctx.fill();
        Canvas.ctx.lineWidth = style_config.goal.postLineWidth;
        Canvas.ctx.strokeStyle = style_config.goal.postStrokeStyle;
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        Canvas.startDraw();
        Canvas.ctx.arc(this.bottomPostPosition.x, this.bottomPostPosition.y, map_config[this.mapKind].goal.postRadius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = style_config.goal.rightPostFillStyle;
        Canvas.ctx.fill();
        Canvas.ctx.lineWidth = style_config.goal.postLineWidth;
        Canvas.ctx.strokeStyle = style_config.goal.postStrokeStyle;
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}