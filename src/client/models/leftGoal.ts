import { getCornerPoints } from './../../shared/vertices';
import { getOffset } from './../../shared/offset';
import { IPos } from './../../shared/model';
import { map_config, MapKind, style_config } from './../../shared/callibration';
import { Canvas } from './canvas';


export class LeftGoal {
    private pos: IPos;
    private topPostPosition: IPos;
    private bottomPostPosition: IPos;

    public constructor(private mapKind: MapKind) {
        this.pos = { x: map_config[this.mapKind].border.side - (map_config[this.mapKind].goal.size.width), y: (map_config[this.mapKind].outerSize.height / 2) - (map_config[this.mapKind].goal.size.height / 2) };
        this.topPostPosition = { x: this.pos.x + map_config[this.mapKind].goal.size.width, y: this.pos.y };
        this.bottomPostPosition = { x: this.pos.x + map_config[this.mapKind].goal.size.width, y: this.pos.y + map_config[this.mapKind].goal.size.height };
    }

    private getPoints(pos = { x: 0, y: 0 }): ([number, number])[] {
        const offset = getOffset(pos, map_config[this.mapKind].goal.size)
        const goalTickness = 10;
        return [
            [offset.right, offset.bottom],
            [offset.left + map_config[this.mapKind].goal.cornerRadius, offset.bottom],
            ...getCornerPoints(map_config[this.mapKind].goal.cornerPointsAmount, Math.PI / 2, { x: offset.left + map_config[this.mapKind].goal.cornerRadius, y: offset.bottom - map_config[this.mapKind].goal.cornerRadius }, map_config[this.mapKind].goal.cornerRadius),
            [offset.left, offset.bottom - map_config[this.mapKind].goal.cornerRadius],
            [offset.left, offset.top + map_config[this.mapKind].goal.cornerRadius],
            ...getCornerPoints(map_config[this.mapKind].goal.cornerPointsAmount, Math.PI, { x: offset.left + map_config[this.mapKind].goal.cornerRadius, y: offset.top + map_config[this.mapKind].goal.cornerRadius }, map_config[this.mapKind].goal.cornerRadius),
            [offset.left + map_config[this.mapKind].goal.cornerRadius, offset.top],
            [offset.right, offset.top],
            [offset.right, offset.top - goalTickness],
            [offset.left - goalTickness, offset.top - goalTickness],
            [offset.left - goalTickness, offset.bottom + goalTickness],
            [offset.right, offset.bottom + goalTickness],
        ]
    }

    public render(): void {
        Canvas.startDraw();
        const vertices = this.getPoints(this.pos);
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
        Canvas.ctx.arc(this.topPostPosition.x, this.topPostPosition.y , map_config[this.mapKind].goal.postRadius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = style_config.goal.leftPostFillStyle;
        Canvas.ctx.fill();
        Canvas.ctx.lineWidth = style_config.goal.postLineWidth;
        Canvas.ctx.strokeStyle = style_config.goal.postStrokeStyle;
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        Canvas.startDraw();
        Canvas.ctx.arc(this.bottomPostPosition.x, this.bottomPostPosition.y, map_config[this.mapKind].goal.postRadius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = style_config.goal.leftPostFillStyle;
        Canvas.ctx.fill();
        Canvas.ctx.lineWidth = style_config.goal.postLineWidth;
        Canvas.ctx.strokeStyle = style_config.goal.postStrokeStyle;
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}