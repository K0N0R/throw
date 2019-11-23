import { player } from './../../shared/callibration';
import { IPos } from './../../shared/model';
import { Team } from './../../shared/team';

import { Canvas } from './canvas';

export class Player {
    public socketId: string;
    public pos: IPos;
    public team: Team;

    public sprinting!: boolean;
    public sprintingCooldown!: boolean;
    private sprintingCooldownLeft = player.sprintingCooldown;
    public shootingStrong!: boolean;
    public shootingWeak!: boolean;

    public constructor(pos: IPos, socketId: string, team: Team) {
        this.pos = pos;
        this.socketId = socketId;
        this.team = team;
    }

    public sprintingCooldownTimer() {
        const animationTick = 100; // the smaller the smoother
        this.sprintingCooldownLeft = player.sprintingCooldown; 
        const interval = setInterval(() => {
            this.sprintingCooldownLeft -= animationTick;
            if (this.sprintingCooldownLeft < 0 ) {
                this.sprintingCooldownLeft = player.sprintingCooldown;
                clearInterval(interval);
            }
        }, animationTick);
    }

    public render(): void {
        if (this.sprintingCooldown) {
            Canvas.startDraw();
            Canvas.ctx.moveTo(this.pos.x, this.pos.y);
            Canvas.ctx.arc(this.pos.x, this.pos.y, player.radius + 10, -Math.PI/2 + (-2 * Math.PI * this.sprintingCooldownLeft/player.sprintingCooldown), -Math.PI/2, false);
            Canvas.ctx.fillStyle = this.team === Team.Left ? '#804663A0' : '#808F1218';
            Canvas.ctx.fill();
            Canvas.stopDraw();
        }
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