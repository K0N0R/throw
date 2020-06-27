import { MapKind, map_config, style_config, game_config } from './../../shared/callibration';
import { IPos } from './../../shared/model';
import { Team } from './../../shared/team';

import { Canvas } from './canvas';
import { User } from './socket';

export class Player {
    public afk: boolean = false;

    public dashing!: boolean;
    public dashCooldown!: boolean;

    private dashingDurationTimeout;
    private dashCooldownTimeout;
    private dashingCoolownAnimationInterval;
    private dashingCooldownAnimationTimeLeft!: number;

    public shooting!: boolean;
    

    public constructor(
        private mapKind: MapKind,
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
                }, game_config.player.dashCooldown);
            }, game_config.player.dashDuration)
        }
    }

    public dashingCooldownTimer() {
        const animationTick = 50; // the smaller the smoother
        this.dashingCooldownAnimationTimeLeft = game_config.player.dashCooldown; 
        this.dashingCoolownAnimationInterval = setInterval(() => {
            this.dashingCooldownAnimationTimeLeft -= animationTick;
            if (this.dashingCooldownAnimationTimeLeft < 0 ) {
                this.dashingCooldownAnimationTimeLeft = game_config.player.dashCooldown;
                clearInterval(this.dashingCoolownAnimationInterval);
            }
        }, animationTick);
    }

    private afkCloudVertices(): IPos[] {
        const afkMessageSize = map_config[this.mapKind].player.radius * 0.7;
        const afkMessageBottomY = map_config[this.mapKind].player.radius * 1.2;
        return [
            { x: this.pos.x - afkMessageSize, y: this.pos.y - afkMessageBottomY - afkMessageSize },
            { x: this.pos.x - afkMessageSize, y: this.pos.y - afkMessageBottomY - 2 * afkMessageSize },
            { x: this.pos.x + afkMessageSize, y: this.pos.y - afkMessageBottomY - 2 * afkMessageSize },
            { x: this.pos.x + afkMessageSize, y: this.pos.y - afkMessageBottomY - afkMessageSize },
            { x: this.pos.x, y: this.pos.y - afkMessageBottomY * 1.1 }
        ];
    }

    private afkDots(): IPos[] {
        const afkMessageSize = map_config[this.mapKind].player.radius * 0.7;
        const afkMessageBottomY = map_config[this.mapKind].player.radius * 1.2;
        return [
            { x: this.pos.x - afkMessageSize/2, y: this.pos.y - afkMessageBottomY - 1.5 * afkMessageSize },
            { x: this.pos.x, y: this.pos.y - afkMessageBottomY - 1.5 * afkMessageSize },
            { x: this.pos.x + afkMessageSize/2, y: this.pos.y - afkMessageBottomY - 1.5 * afkMessageSize, },
        ]
    }

    public render(): void {
        // render player
        Canvas.startDraw();
        Canvas.ctx.arc(this.pos.x, this.pos.y, map_config[this.mapKind].player.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = this.team === Team.Left ? style_config.player.leftFillStyle  : style_config.player.rightFillStyle;
        Canvas.ctx.fill();
        Canvas.ctx.strokeStyle = this.shooting ? style_config.player.shootingStrokeStyle : style_config.player.strokeStyle;
        Canvas.ctx.lineWidth = style_config.player.lineWidth;
        Canvas.ctx.stroke();
        Canvas.stopDraw();

        // render player avatar
        Canvas.startDraw();
        Canvas.ctx.textAlign = 'center';
        Canvas.ctx.font = `${map_config[this.mapKind].player.radius*1.2}px consolas`;
        Canvas.ctx.fillStyle = 'white';
        Canvas.ctx.fillText(this.avatar, this.pos.x, this.pos.y + (map_config[this.mapKind].player.radius*0.4));
        Canvas.stopDraw();
    }

    public renderInfo(): void {
        if (User.socket.id === this.socketId) { // render self identifier
            Canvas.startDraw();
            Canvas.ctx.globalAlpha = 0.2;
            Canvas.ctx.arc(this.pos.x, this.pos.y, style_config.player.meIndicatorRadius, 0, 2 * Math.PI, true);
            Canvas.ctx.strokeStyle = style_config.player.meIndicatorStrokeStyle;
            Canvas.ctx.lineWidth = style_config.player.meIndicatorLineWidth;
            Canvas.ctx.stroke();
            Canvas.ctx.globalAlpha = 1;
            Canvas.stopDraw();
        }
        if (this.dashCooldown) { // render dash cooldown animation frame
            Canvas.ctx.moveTo(this.pos.x, this.pos.y);
            Canvas.startDraw();
            Canvas.ctx.globalAlpha = 0.5;
            Canvas.ctx.arc(this.pos.x, this.pos.y, style_config.player.meIndicatorRadius, -Math.PI/2 + (-2 * Math.PI * this.dashingCooldownAnimationTimeLeft/game_config.player.dashCooldown), -Math.PI/2, false);
            Canvas.ctx.lineWidth = style_config.player.meIndicatorLineWidth;
            Canvas.ctx.stroke();
            Canvas.ctx.globalAlpha = 1;
            Canvas.stopDraw();
        }
        // render player nick
        Canvas.startDraw();
        Canvas.ctx.textAlign = 'center';
        Canvas.ctx.font = `${map_config[this.mapKind].player.radius*0.8}px consolas`;
        Canvas.ctx.fillStyle = 'white';
        Canvas.ctx.fillText(this.nick, this.pos.x, this.pos.y + map_config[this.mapKind].player.radius + map_config[this.mapKind].player.radius/2 + map_config[this.mapKind].player.radius*0.4);
        Canvas.stopDraw();

        // render afk
        if (this.afk) {
            Canvas.startDraw();
            const afkMessageBottomY = map_config[this.mapKind].player.radius * 1.2;
            const verticesAfk = this.afkCloudVertices();
            Canvas.ctx.moveTo(this.pos.x, this.pos.y - afkMessageBottomY * 1.1);
            verticesAfk.forEach(v => Canvas.ctx.lineTo(v.x, v.y));
            Canvas.ctx.fillStyle ='white';
            Canvas.ctx.fill();
            Canvas.stopDraw();

            Canvas.startDraw();
            const afkDots = this.afkDots()
            const afkDotRadius = map_config[this.mapKind].player.radius*0.1;
            afkDots.forEach(v => Canvas.ctx.arc(v.x, v.y, afkDotRadius, 0, 2 * Math.PI, true));
            Canvas.ctx.fillStyle ='black';
            Canvas.ctx.fill();
            Canvas.stopDraw();
        }
    }
}