import { game_config, player_config, canvas_config, map_config, player_style } from './../../shared/callibration';
import { Canvas } from './canvas';
import { IPos } from './../../shared/model';
import { Team } from '../../shared/team';

export class Score {
    public scoreInfo: {
        text: string;
        fillStyle: string;
        scale: number;
    } | null = null;
    public left!: number;
    public right!: number;
    public pos: IPos;
    constructor() {
        this.pos = {
            x: canvas_config.size.width / 2,
            y: canvas_config.size.height / 2
        };
    }

    public updateScore(score: { left: number | null; right: number | null}): void {
        if (score.left !== null) {
            this.left = score.left;
        }

        if (score.right !== null) {
            this.right = score.right;
        }

        const leftScoreEl = document.getElementById('score-left');
        if (leftScoreEl && score.left !== null) {
            leftScoreEl.innerHTML = `${score.left}`;
        }
        
        const rightScoreEl = document.getElementById('score-right');
        if (rightScoreEl && score.right !== null) {
            rightScoreEl.innerHTML = `${score.right}`;
        }
    }

    public showScorrerName(team: Team): void {
        if (team === Team.Left) this.showScoreInfo('Red team scores!', player_style.leftFillStyle);
        if (team === Team.Right) this.showScoreInfo('Blue team scores!', player_style.rightFillStyle);
    }

    public showScoreInfoTimeoutHandler;
    public showScoreInfo(text: string, fillStyle: string): void {
        this.scoreInfo = {
            text,
            fillStyle,
            scale: 1
        };
        this.showScoreInfoTimeoutHandler = setTimeout(() => {
            this.scoreInfo = null;
        }, game_config.goalResetTimeout);
    }

    public dispose(): void {
        clearTimeout(this.showScoreInfoTimeoutHandler);
    }

    public render(): void {
        if (this.scoreInfo) {
            Canvas.startDraw();
            Canvas.ctx.textAlign = 'center';
            const font = player_config.radius * this.scoreInfo.scale >  player_config.radius*5 ? player_config.radius*5 : player_config.radius * this.scoreInfo.scale;
            Canvas.ctx.font = `${font }px consolas`;
            Canvas.ctx.lineWidth = font*0.05;
            Canvas.ctx.strokeStyle = '#333';
            Canvas.ctx.strokeText(this.scoreInfo.text, this.pos.x, this.pos.y);
            Canvas.ctx.fillStyle = this.scoreInfo.fillStyle;
            Canvas.ctx.fillText(this.scoreInfo.text, this.pos.x, this.pos.y);
            Canvas.stopDraw();
            this.scoreInfo.scale += 0.05;
        }
    }

}