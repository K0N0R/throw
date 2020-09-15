import { MapKind, map_config, style_config, game_config } from './../../shared/callibration';
import { IPos } from './../../shared/model';
import { Team } from './../../shared/team';

import { Canvas } from './canvas';
import { User } from './socket';

export class Player {
    public afk: boolean = false;

    public shooting!: boolean;
    
    public constructor(
        private mapKind: MapKind,
        public nick: string,
        public avatar: string,
        public pos: IPos,
        public socketId: string,
        public team: Team) {
        this.setAvatarImg();
        this.setNickImg();
    }

    public dispose(): void {
    }

    private nickImg!: HTMLImageElement;
    private nickImgWidth!: number;
    public setNickImg() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const imageElem = document.createElement('img');
            const imageSize = map_config[this.mapKind].player.radius;
            const font = `${imageSize*0.8}px consolas`;
            ctx.font = font,
            ctx.canvas.width = ctx.measureText(this.nick).width;
            this.nickImgWidth = ctx.canvas.width;
            ctx.canvas.height = imageSize;
            // debug background
            // ctx.beginPath();
            // ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
            // ctx.fillStyle = 'blue';
            // ctx.fill();
            ctx.fillStyle ='white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = font,
            ctx.fillText(this.nick, ctx.canvas.width/2, imageSize/2);
            imageElem.src = ctx.canvas.toDataURL();
            this.nickImg = imageElem;
        }
    }

    private avatarImg!: HTMLImageElement;
    public setAvatarImg() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const imageElem = document.createElement('img');
            const imageSize = map_config[this.mapKind].player.radius * 2;
            ctx.canvas.width = imageSize;
            ctx.canvas.height = imageSize + style_config.player.lineWidth;
            // debug background
            // ctx.beginPath();
            // ctx.rect(0, 0, imageSize, imageSize);
            // ctx.fillStyle = 'yellow';
            // ctx.fill();
            ctx.font = `${imageSize*0.6}px consolas`,
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle ='black';
            ctx.fillText(this.avatar, imageSize/2, imageSize/2 + style_config.player.lineWidth);
            imageElem.src = ctx.canvas.toDataURL();
            this.avatarImg = imageElem;
        }
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
        Canvas.ctx.drawImage(this.avatarImg, this.pos.x - map_config[this.mapKind].player.radius, this.pos.y - map_config[this.mapKind].player.radius);
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
        // render player nick
        Canvas.startDraw();
        Canvas.ctx.drawImage(this.nickImg, this.pos.x - this.nickImgWidth/2, this.pos.y + map_config[this.mapKind].player.radius*1.5);
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