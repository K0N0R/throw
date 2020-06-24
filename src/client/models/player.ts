import { player_config, player_style } from './../../shared/callibration';
import { IPos } from './../../shared/model';
import { Team } from './../../shared/team';

import { Canvas } from './canvas';
import { User } from './socket';

export class Player {
    public dashing!: boolean;
    public dashCooldown!: boolean;

    private dashingDurationTimeout;
    private dashCooldownTimeout;
    private dashingCoolownAnimationInterval;
    private dashingCooldownAnimationTimeLeft!: number;

    public shooting!: boolean;

    public constructor(
        public nick: string,
        public avatar: string,
        public pos: IPos,
        public socketId: string,
        public team: Team) {
    }

    public dispose(): void {
        clearTimeout(this.dashingDurationTimeout);
        clearTimeout(this.dashCooldownTimeout);
        clearInterval(this.dashingCoolownAnimationInterval);
    }

    public dash(dashing: boolean): void {
        if (!this.dashing && dashing) {
            this.dashing = true;
            this.dashingDurationTimeout = setTimeout(() => {
                this.dashingCooldownTimer();
                this.dashCooldown = true;
                this.dashCooldownTimeout = setTimeout(() => {
                    this.dashing = false;
                    this.dashCooldown = false;
                }, player_config.dashCooldown);
            }, player_config.dashDuration)
        }
    }

    public dashingCooldownTimer() {
        const animationTick = 50; // the smaller the smoother
        this.dashingCooldownAnimationTimeLeft = player_config.dashCooldown; 
        this.dashingCoolownAnimationInterval = setInterval(() => {
            this.dashingCooldownAnimationTimeLeft -= animationTick;
            if (this.dashingCooldownAnimationTimeLeft < 0 ) {
                this.dashingCooldownAnimationTimeLeft = player_config.dashCooldown;
                clearInterval(this.dashingCoolownAnimationInterval);
            }
        }, animationTick);
    }

    public render(): void {
        
        if (User.socket.id === this.socketId) { // render self identifier
            Canvas.startDraw();
            Canvas.ctx.globalAlpha = 0.2;
            Canvas.ctx.arc(this.pos.x, this.pos.y, player_style.meIndicatorRadius, 0, 2 * Math.PI, true);
            Canvas.ctx.strokeStyle = player_style.meIndicatorStrokeStyle;
            Canvas.ctx.lineWidth = player_style.meIndicatorLineWidth;
            Canvas.ctx.stroke();
            Canvas.ctx.globalAlpha = 1;
            Canvas.stopDraw();
        }
        if (this.dashCooldown) { // render dash cooldown animation frame
            Canvas.ctx.moveTo(this.pos.x, this.pos.y);
            Canvas.startDraw();
            Canvas.ctx.globalAlpha = 0.5;
            Canvas.ctx.arc(this.pos.x, this.pos.y, player_style.meIndicatorRadius, -Math.PI/2 + (-2 * Math.PI * this.dashingCooldownAnimationTimeLeft/player_config.dashCooldown), -Math.PI/2, false);
            Canvas.ctx.lineWidth = player_style.meIndicatorLineWidth;
            Canvas.ctx.stroke();
            Canvas.ctx.globalAlpha = 1;
            Canvas.stopDraw();
        }
        // render player
        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x, this.pos.y, player_config.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = this.team === Team.Left ? player_style.leftFillStyle  : player_style.rightFillStyle;
        Canvas.ctx.fill();
        Canvas.ctx.strokeStyle = this.shooting ? player_style.shootingStrokeStyle : player_style.strokeStyle;
        Canvas.ctx.lineWidth = player_style.lineWidth;
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        // render player nick
        Canvas.startDraw();
        Canvas.ctx.textAlign = 'center';
        Canvas.ctx.font = `${player_config.radius*0.8}px consolas`;
        Canvas.ctx.fillStyle = 'white';
        Canvas.ctx.fillText(this.nick, this.pos.x, this.pos.y + player_config.radius + player_config.radius/2 + player_config.radius*0.4);

        // render player avatar
        Canvas.ctx.font = `${player_config.radius*1.2}px consolas`;
        Canvas.ctx.fillText(this.avatar, this.pos.x, this.pos.y + (player_config.radius*1.2)/3);
        Canvas.stopDraw();

    }
}