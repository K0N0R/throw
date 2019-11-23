import { player } from './../../shared/callibration';
import { IPos } from './../../shared/model';
import { Team } from './../../shared/team';

import { Canvas } from './canvas';

export class Player {
    public socketId: string;
    public pos: IPos;
    public team: Team;

    public shootingStrong!: boolean;
    public shootingWeak!: boolean;

    public constructor(pos: IPos, socketId: string, team: Team) {
        this.pos = pos;
        this.socketId = socketId;
        this.team = team;
    }

    public render(): void {
        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x, this.pos.y, player.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = this.team === Team.Left ? '#4663A0' : '#8F1218';
        Canvas.ctx.fill();
        Canvas.ctx.strokeStyle = this.shootingStrong || this.shootingWeak ? 'white' : 'black';
        Canvas.ctx.lineWidth = 3;
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}