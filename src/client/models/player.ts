import * as p2 from 'p2';

import { calculateVectorLength, normalizeVector } from './../../shared/vector';
import { Keys } from './../../shared/keys';
import { player_config, player_style } from './../../shared/callibration';
import { Team } from './../../shared/team';
import { MAP_BORDER, PLAYER, BALL, GOAL_POST } from '../../shared/collision';
import { IPlayerKey } from './../../shared/events';
import { playerMaterial } from '../../shared/material';

import { Canvas } from './canvas';

export class Player {
    public socketId: string;
    public body!: p2.Body;
    private shape!: p2.Circle;
    public keyMap: IPlayerKey = {};

    public shooting!: boolean;
    public sprinting!: boolean;
    public sprintingCooldown!: boolean;
    private sprintingCooldownLeft = player_config.sprintingCooldown;
    public me: boolean;
    public team!: Team;

    public get movementIncrease(): number {
        return this.sprinting
            ? player_config.sprintMovementIncrease
            : player_config.movementIncrease
    };
    public get maxSpeed(): number {
        return this.sprinting
            ? player_config.sprintMaxSpeed
            : player_config.maxSpeed
    }

    public constructor(socketId: string, position: [number, number], team: Team, me = false) {

        this.socketId = socketId;
        let options: p2.BodyOptions = {
            mass: player_config.mass,
            position: position,
            velocity: [0, 0],
        };
        this.body = new p2.Body(options);
        this.shape = new p2.Circle({
            radius: player_config.radius,
            collisionGroup: PLAYER,
            collisionMask: PLAYER | MAP_BORDER | BALL | GOAL_POST 
        });
        this.shape.material = playerMaterial;
        this.body.addShape(this.shape);
        this.body.damping = player_config.damping;

        this.team = team;
        this.me = me;
    }

    public onMovmentChange(): void {
        const moveVector = { x: this.body.velocity[0], y: this.body.velocity[1] };
        const movmentLength = calculateVectorLength(moveVector);
        if (movmentLength > this.maxSpeed) {
            const normalizedMoveVector = normalizeVector(moveVector);
            this.body.velocity[0] = normalizedMoveVector.x * this.maxSpeed;
            this.body.velocity[1] = normalizedMoveVector.y * this.maxSpeed;
        }
    }

    public logic(): void {
        for (let key in this.keyMap) {
            switch (Number(key)) {
                case Keys.Up:
                    if (this.keyMap[key]) this.body.velocity[1] -= this.movementIncrease;
                    break;
                case Keys.Down:
                    if (this.keyMap[key]) this.body.velocity[1] += this.movementIncrease;
                    break;
                case Keys.Left:
                    if (this.keyMap[key]) this.body.velocity[0] -= this.movementIncrease;
                    break;
                case Keys.Right:
                    if (this.keyMap[key]) this.body.velocity[0] += this.movementIncrease;
                    break;
                case Keys.Shift:
                    this.sprinting = this.keyMap[key];
                    break;
                case Keys.X:
                    this.shooting = this.keyMap[key];
                    //this.io.emit('player::shooting', { socketId: newPlayer.socketId, shooting: data[key] } as IPlayerShooting);
                    break;
            }
        }
        this.onMovmentChange();
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
            Canvas.ctx.arc(this.body.position[0], this.body.position[1], player_style.meIndicatorRadius, 0, 2 * Math.PI, true);
            Canvas.ctx.strokeStyle = player_style.meIndicatorStrokeStyle;
            Canvas.ctx.lineWidth = player_style.meIndicatorLineWidth;
            Canvas.ctx.stroke();
            Canvas.ctx.globalAlpha = 1;
            Canvas.stopDraw();
        }
        if (this.sprintingCooldown) {
            Canvas.ctx.moveTo(this.body.position[0], this.body.position[1]);
            Canvas.startDraw();
            Canvas.ctx.globalAlpha = 0.5;
            Canvas.ctx.arc(this.body.position[0], this.body.position[1], player_style.meIndicatorRadius, -Math.PI/2 + (-2 * Math.PI * this.sprintingCooldownLeft/player_config.sprintingCooldown), -Math.PI/2, false);
            Canvas.ctx.lineWidth = player_style.meIndicatorLineWidth;
            Canvas.ctx.stroke();
            Canvas.ctx.globalAlpha = 1;
            Canvas.stopDraw();
        }
        Canvas.startDraw();
        Canvas.ctx.arc(this.body.position[0], this.body.position[1], player_config.radius, 0, 2 * Math.PI, true);
        Canvas.ctx.fillStyle = this.team === Team.Left ? player_style.leftFillStyle  : player_style.rightFillStyle;
        Canvas.ctx.fill();
        Canvas.ctx.strokeStyle = this.shooting ? player_style.shootingStrokeStyle : player_style.strokeStyle;
        Canvas.ctx.lineWidth = player_style.lineWidth;
        Canvas.ctx.stroke();
        Canvas.stopDraw();
    }
}