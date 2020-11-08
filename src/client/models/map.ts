import { IPos } from './../../shared/model';
import { getOffset } from './../../shared/offset';
import { getCornerPoints } from './../../shared/vertices';
import { MapKind, map_config, style_config } from './../../shared/callibration';

import { Canvas } from './canvas';

export class Map {
    public pos: IPos;
    public outerPos: IPos;
    public bckgrImg: any;

    public constructor(private mapKind: MapKind) {

        this.pos = {
            x: map_config[this.mapKind].border.side,
            y: map_config[this.mapKind].border.upDown
        };

        this.outerPos = {
            x: 0,
            y: 0
        };

        this.bckgrImg = document.querySelector('#game-asset')

        this.topShapePoints = this.getTopShapePoints(this.pos);
        this.bottomShapePoints = this.getBottomShapePoints(this.pos);
        this.bckgrImagePoints = this.getBckgrImagePoints();
    }


    private topShapePoints: ([number, number])[];
    private getTopShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, map_config[this.mapKind].size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.left, offset.midVert - map_config[this.mapKind].goal.size.height / 2],
            [offset.left, offset.top + map_config[this.mapKind].cornerRadius],
            ...getCornerPoints(map_config[this.mapKind].cornerPointsAmount, Math.PI, { x: offset.left + map_config[this.mapKind].cornerRadius, y: offset.top + map_config[this.mapKind].cornerRadius }, map_config[this.mapKind].cornerRadius),
            [offset.left + map_config[this.mapKind].cornerRadius, offset.top],
            [offset.right - map_config[this.mapKind].cornerRadius, offset.top],
            ...getCornerPoints(map_config[this.mapKind].cornerPointsAmount, Math.PI + Math.PI / 2, { x: offset.right - map_config[this.mapKind].cornerRadius, y: offset.top + map_config[this.mapKind].cornerRadius }, map_config[this.mapKind].cornerRadius),
            [offset.right, offset.top + map_config[this.mapKind].cornerRadius],
            [offset.right, offset.midVert - map_config[this.mapKind].goal.size.height / 2],

            // [offset.right + mapTickness, offset.midVert - map_config[this.mapKind].goal.size.height / 2], // obramówka zewnętrzna
            // [offset.right + mapTickness, offset.top - mapTickness],
            // [offset.left - mapTickness, offset.top - mapTickness],
            // [offset.left - mapTickness, offset.midVert - map_config[this.mapKind].goal.size.height / 2],
        ];
    }

    private bottomShapePoints: ([number, number])[];
    private getBottomShapePoints(pos = { x: 0, y: 0 }): ([number, number])[] { // pos for debbuging
        const offset = getOffset(pos, map_config[this.mapKind].size); // convex use relative position to body
        const mapTickness = 10;
        return [
            [offset.right, offset.midVert + map_config[this.mapKind].goal.size.height / 2],
            [offset.right, offset.bottom - map_config[this.mapKind].cornerRadius],
            ...getCornerPoints(map_config[this.mapKind].cornerPointsAmount, 0, { x: offset.right - map_config[this.mapKind].cornerRadius, y: offset.bottom - map_config[this.mapKind].cornerRadius }, map_config[this.mapKind].cornerRadius),
            [offset.right - map_config[this.mapKind].cornerRadius, offset.bottom],
            [offset.left + map_config[this.mapKind].cornerRadius, offset.bottom],
            ...getCornerPoints(map_config[this.mapKind].cornerPointsAmount, Math.PI / 2, { x: offset.left + map_config[this.mapKind].cornerRadius, y: offset.bottom - map_config[this.mapKind].cornerRadius }, map_config[this.mapKind].cornerRadius),
            [offset.left, offset.bottom - map_config[this.mapKind].cornerRadius],
            [offset.left, offset.midVert + map_config[this.mapKind].goal.size.height / 2],

            // [offset.left - mapTickness, offset.midVert + map_config[this.mapKind].goal.size.height / 2],// obramówka zewnętrzna
            // [offset.left - mapTickness, offset.bottom + mapTickness],
            // [offset.right + mapTickness, offset.bottom + mapTickness],
            // [offset.right + mapTickness, offset.midVert + map_config[this.mapKind].goal.size.height / 2],
        ];
    }

    private bckgrImagePoints: IPos[];
    private getBckgrImagePoints(): IPos[] {
        const points: IPos[] = [];
        const imgSize = 256;
        const maxX = Math.ceil(map_config[this.mapKind].outerSize.width/imgSize);
        const maxY = Math.ceil(map_config[this.mapKind].outerSize.height/imgSize);
        for (let i = 0; i <= maxX; i++) {
            for (let j = 0; j <= maxY; j++) {
                let x = i * imgSize;
                if (x + imgSize > map_config[this.mapKind].outerSize.width) {
                    x = map_config[this.mapKind].outerSize.width - imgSize;
                }
                let y = j * imgSize;
                if (y + imgSize > map_config[this.mapKind].outerSize.height) {
                    y = map_config[this.mapKind].outerSize.height - imgSize;
                }
                points.push({ x, y });
            }
        }
        return points;
    }

    public render(): void {

        const pitchPattern = Canvas.ctx.createPattern(this.bckgrImg, 'repeat');
        Canvas.startDraw();
        const mapBorderVertices = [
            ...this.topShapePoints,
            ...this.bottomShapePoints
        ];
        Canvas.ctx.moveTo(mapBorderVertices[0][0], mapBorderVertices[0][1]);
        mapBorderVertices
            .forEach(v => {
                Canvas.ctx.lineTo(v[0], v[1]);
            });
        Canvas.ctx.lineWidth = style_config.map.lineWidth;
        Canvas.ctx.strokeStyle = style_config.map.strokeStyle;
        Canvas.ctx.fillStyle = pitchPattern ?? '';
        Canvas.ctx.fill();
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        // left goal line
        Canvas.startDraw(); 
        Canvas.ctx.moveTo(this.pos.x, this.pos.y + map_config[this.mapKind].size.height / 2 - map_config[this.mapKind].goal.size.height / 2);
        Canvas.ctx.lineTo(this.pos.x, this.pos.y + map_config[this.mapKind].size.height / 2 + map_config[this.mapKind].goal.size.height / 2);
        Canvas.ctx.lineWidth = style_config.map.lineWidth;
        Canvas.ctx.strokeStyle = style_config.map.strokeStyle;
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        // right goal line
        Canvas.startDraw(); 
        Canvas.ctx.moveTo(this.pos.x + map_config[this.mapKind].size.width, this.pos.y + map_config[this.mapKind].size.height / 2 - map_config[this.mapKind].goal.size.height / 2);
        Canvas.ctx.lineTo(this.pos.x + map_config[this.mapKind].size.width, this.pos.y + map_config[this.mapKind].size.height / 2 + map_config[this.mapKind].goal.size.height / 2);
        Canvas.ctx.lineWidth = style_config.map.lineWidth;
        Canvas.ctx.strokeStyle = style_config.map.strokeStyle;
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        // middle line
        Canvas.startDraw(); 
        Canvas.ctx.moveTo(this.pos.x + map_config[this.mapKind].size.width / 2, this.pos.y);
        Canvas.ctx.lineTo(this.pos.x + map_config[this.mapKind].size.width / 2, this.pos.y + map_config[this.mapKind].size.height);
        Canvas.ctx.lineWidth = style_config.map.lineWidth;
        Canvas.ctx.strokeStyle = style_config.map.strokeStyle;
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        // middle circle
        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x + map_config[this.mapKind].size.width / 2, this.pos.y + map_config[this.mapKind].size.height / 2, map_config[this.mapKind].middleRadius + (style_config.map.lineWidth/2), 0, Math.PI * 2);
        Canvas.ctx.lineWidth = style_config.map.lineWidth;
        Canvas.ctx.strokeStyle = style_config.map.strokeStyle;
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        // mini middle circle
        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x + map_config[this.mapKind].size.width / 2, this.pos.y + map_config[this.mapKind].size.height / 2, map_config[this.mapKind].ball.radius*3/4, 0, Math.PI * 2);
        Canvas.ctx.fillStyle = style_config.map.strokeStyle;
        Canvas.ctx.fill();
        Canvas.stopDraw();
    }
}