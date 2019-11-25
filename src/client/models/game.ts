import { goal_config, map_config, player_config } from './../../shared/callibration';
import { getOffset } from './../../shared/offset';
import { Keys } from './../../shared/keys';
import { IPlayerInit, IPlayerAdd, IPlayerDispose, IPlayerKey, IPlayerShooting, IWorldPostStep, IWorldReset } from './../../shared/events';

import { Canvas } from './canvas';
import { KeysHandler } from './keysHandler';
import { Player } from './player';
import { Map } from './map';
import { Ball } from './ball';
import { RightGoal } from './rightGoal';
import { LeftGoal } from './leftGoal';
import { Camera } from './camera';
import { Score } from './score';

export class Game {
    private socket: SocketIOClient.Socket;

    private map!: Map;
    private players: Player[] = [];
    private ball!: Ball;
    private leftGoal!: LeftGoal;
    private rightGoal!: RightGoal;
    private score!: Score;

    constructor(socket: SocketIOClient.Socket) {
        this.socket = socket;
        this.initHandlers();
        this.initCanvas();
        this.initEntities();
        this.initCamera();
        this.initEvents();
        this.socket.on('world::postStep', (data: IWorldPostStep) => {
            data.playersMoving.forEach(dataPlayer => {
                const player = this.players.find(player => player.socketId === dataPlayer.socketId);
                if (player) {
                    player.pos.x = dataPlayer.position[0];
                    player.pos.y = dataPlayer.position[1];
                    if (dataPlayer.socketId === this.socket.id) {
                        Camera.updatePos({ ...player.pos });
                    }
                }
            });
            if (data.ballMoving) {
                this.ball.pos.x = data.ballMoving.position[0];
                this.ball.pos.y = data.ballMoving.position[1];
            }
            if (data.scoreLeft || data.scoreRight) {
                this.score.updateScore({
                    left: data.scoreLeft,
                    right: data.scoreRight
                });
            }
        });
    }

    private initEvents(): void {
        this.socket.on('world::reset', (data: IWorldReset) => {
            this.ball.pos = { x: data.ball.position[0], y: data.ball.position[1] };
            data.players.forEach(dataPlayer => {
                const player = this.players.find(player => player.socketId === dataPlayer.socketId);
                if (player) {
                    player.pos.x = dataPlayer.position[0];
                    player.pos.y = dataPlayer.position[1];
                } 
            });
        });

        this.socket.on('player::init', (data: IPlayerInit) => {
            this.players.push(...data.players.map(p => new Player({ x: p.position[0], y: p.position[1] }, p.socketId, p.team)));
            this.ball.pos = { x: data.ball.position[0], y: data.ball.position[1] };
            this.score.updateScore(data.score);
        });

        this.socket.on('player::add', (data: IPlayerAdd) => {
            this.players.push(new Player({ x: data.position[0], y: data.position[1] }, data.socketId, data.team, data.socketId === this.socket.id));
            if(data.socketId === this.socket.id) {
                Camera.updatePos({ x: data.position[0], y: data.position[1] });
            }
        });

        this.socket.on('player::dispose', (data: IPlayerDispose) => {
            const idx = this.players.findIndex(player => player.socketId === data.socketId);
            this.players.splice(idx, 1);
        });

        this.socket.on('player::shooting', (data: IPlayerShooting) => {
            const player = this.players.find(player => player.socketId === data.socketId);
            if (player) {
                player.shooting = data.shootingStrong !== void 0 ? data.shootingStrong : player.shooting;
            }
        });
    }

    private initHandlers(): void {
        const handleShooting = (player: Player, pressed: { [param: number]: boolean }) => {
            player.shooting = pressed[Keys.X];
        };
        const handleSprinting = (player: Player, pressed: { [param: number]: boolean }) => {
            if (player.sprintingCooldown) {
                pressed[Keys.Shift] = false;
            } else if (player.sprinting) {
                pressed[Keys.Shift] = true;
            } else if (pressed[Keys.Shift] && !player.sprintingCooldown) {
                player.sprinting = true;
                setTimeout(() => {
                    player.sprinting = false;
                    player.sprintingCooldown = true;
                    player.sprintingCooldownTimer();
                    setTimeout(() => {
                        player.sprintingCooldown = false;
                    }, player_config.sprintingCooldown);
               }, player_config.sprinting);
            }
        };
        KeysHandler.bindEvents((pressed: { [param: number]: boolean }) => {
            const player = this.players.find(player => player.socketId === this.socket.id);
            if (player) {
                handleShooting(player, pressed);
                handleSprinting(player, pressed);
            }
            this.socket.emit('player::key', pressed as IPlayerKey);
        });
    }
    
    private initCanvas(): void {
        Canvas.createCanvas();
    }

    private initEntities(): void {
        this.map = new Map();
        this.leftGoal = new LeftGoal({ x: this.map.pos.x - goal_config.size.width, y: this.map.pos.y + map_config.size.height / 2 - goal_config.size.height / 2 });
        this.rightGoal = new RightGoal({ x: this.map.pos.x + map_config.size.width, y: this.map.pos.y + map_config.size.height / 2 - goal_config.size.height / 2 });
        this.ball = new Ball({ x: this.map.pos.x + map_config.size.width / 2, y: this.map.pos.y + map_config.size.height / 2 });
        this.score = new Score();
    }

    private initCamera(): void {
        Camera.setBounduary(getOffset(this.map.outerPos, map_config.outerSize));
    }

    public run() {
        KeysHandler.reactOnPressChange();
        this.render();
    }

    public render(): void {
        Canvas.clearCanvas();
        Camera.translateStart();

        this.map.render();
        this.leftGoal.render();
        this.rightGoal.render();
        this.players.forEach(player => {
            player.render();
        });
        this.ball.render();

        Camera.translateEnd();

    }
}