import { player_config, player_style } from './../../shared/callibration';
import { IPos } from './../../shared/model';
import { Team } from './../../shared/team';

import { Canvas } from './canvas';

export class Player {
    public socketId: string;
    public pos: IPos;
    public team: Team;
    public me: boolean;

    public sprinting!: boolean;
    public sprintingCooldown!: boolean;
    private sprintingCooldownLeft = player_config.sprintingCooldown;
    public shootingStrong!: boolean;
    public shootingWeak!: boolean;

    public constructor(pos: IPos, socketId: string, team: Team, me = false) {
        this.pos = pos;
        this.socketId = socketId;
        this.team = team;
        this.me = me;
    }

    public sprintingCooldownTimer() {
        const animationTick = 50; // the smaller the smoother
        this.sprintingCooldownLeft = player_config.sprintingCooldown; 
        const interval = setInterval(() => {
            this.sprintingCooldownLeft -= animationTick;
            if (this.sprintingCooldownLeft < 0 ) {
                this.sprintingCooldownLeft = player_config.sprintingCooldown;
                clearInterval(interval);
            }
        }, animationTick);
    }

    public render(): void {
        if (this.me) {
            Canvas.startDraw();
            Canvas.ctx.globalAlpha = 0.2;
            Canvas.ctx.arc(this.pos.x, this.pos.y, player_style.meIndicatorRadius, 0, 2 * Math.PI, true);
            Canvas.ctx.strokeStyle = player_style.meIndicatorStrokeStyle;
            Canvas.ctx.lineWidth = player_style.meIndicatorLineWidth;
            Canvas.ctx.stroke();
            Canvas.ctx.globalAlpha = 1;
            Canvas.stopDraw();
        }
        if (this.sprintingCooldown) {
            Canvas.ctx.moveTo(this.pos.x, this.pos.y);
            Canvas.startDraw();
            Canvas.ctx.globalAlpha = 0.5;
            Canvas.ctx.arc(this.pos.x, this.pos.y, player_style.meIndicatorRadius, -Math.PI/2 + (-2 * Math.PI * this.sprintingCooldownLeft/player_config.sprintingCooldown), -Math.PI/2, false);
            Canvas.ctx.lineWidth = player_style.meIndicatorLineWidth;
            Canvas.ctx.stroke();
            Canvas.ctx.globalAlpha = 1;
            Canvas.stopDraw();
        }
        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x, this.pos.y, player_config.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = this.team === Team.Left ? player_style.leftFillStyle  : player_style.rightFillStyle;
        Canvas.ctx.fill();
        Canvas.ctx.strokeStyle = this.shootingStrong || this.shootingWeak ? player_style.shootingStrokeStyle : player_style.strokeStyle;
        Canvas.ctx.lineWidth = player_style.lineWidth;
        Canvas.ctx.stroke();
        Canvas.stopDraw();



    }
}