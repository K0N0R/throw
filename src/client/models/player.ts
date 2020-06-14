import { player_config, player_style } from './../../shared/callibration';
import { IPos } from './../../shared/model';
import { Team } from './../../shared/team';

import { Canvas } from './canvas';

export class Player {
    public socketId: string;
    public pos: IPos;
    public team: Team;
    public me: boolean;

    public dashing!: boolean;
    public dashCooldown!: boolean;
    private dashCooldownLeft = player_config.dashCooldown;
    public shooting!: boolean;

    public constructor(public name: string, public avatar: string, pos: IPos, socketId: string, team: Team, me = false) {
        this.pos = pos;
        this.socketId = socketId;
        this.team = team;
        this.me = me;
    }

    public dash(dashing: boolean): void {
        if (!this.dashing && dashing) {
            this.dashing = true;
            setTimeout(() => {
                this.sprintingCooldownTimer();
                this.dashCooldown = true;
                setTimeout(() => {
                    this.dashing = false;
                    this.dashCooldown = false;
                }, player_config.dashCooldown);
            }, player_config.dashDuration)
        }
    }
    public sprintingCooldownTimer() {
        const animationTick = 50; // the smaller the smoother
        this.dashCooldownLeft = player_config.dashCooldown; 
        const interval = setInterval(() => {
            this.dashCooldownLeft -= animationTick;
            if (this.dashCooldownLeft < 0 ) {
                this.dashCooldownLeft = player_config.dashCooldown;
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
        if (this.dashCooldown) {
            Canvas.ctx.moveTo(this.pos.x, this.pos.y);
            Canvas.startDraw();
            Canvas.ctx.globalAlpha = 0.5;
            Canvas.ctx.arc(this.pos.x, this.pos.y, player_style.meIndicatorRadius, -Math.PI/2 + (-2 * Math.PI * this.dashCooldownLeft/player_config.dashCooldown), -Math.PI/2, false);
            Canvas.ctx.lineWidth = player_style.meIndicatorLineWidth;
            Canvas.ctx.stroke();
            Canvas.ctx.globalAlpha = 1;
            Canvas.stopDraw();
        }
        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x, this.pos.y, player_config.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = this.team === Team.Left ? player_style.leftFillStyle  : player_style.rightFillStyle;
        Canvas.ctx.fill();
        Canvas.ctx.strokeStyle = this.shooting ? player_style.shootingStrokeStyle : player_style.strokeStyle;
        Canvas.ctx.lineWidth = player_style.lineWidth;
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        Canvas.startDraw();
        Canvas.ctx.textAlign = 'center';
        Canvas.ctx.font = `${player_config.radius*0.8}px consolas`;
        Canvas.ctx.fillStyle = 'white';
        Canvas.ctx.fillText(this.name, this.pos.x, this.pos.y + player_config.radius + player_config.radius/2 + player_config.radius*0.4);

        Canvas.ctx.font = `${player_config.radius*1.2}px consolas`;
        Canvas.ctx.fillText(this.avatar, this.pos.x, this.pos.y + (player_config.radius*1.2)/3);
        Canvas.stopDraw();

    }
}