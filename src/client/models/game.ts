import { goal_config, map_config } from '../../shared/callibration';
import { getOffset } from '../../shared/offset';
import { IRoomGameData,  IPlayerShooting, IWorldPostStep, IWorldReset } from '../../shared/events';
import { KeysHandler } from '../../shared/keysHandler';

import { Canvas } from './canvas';
import { Player } from './player';
import { Map } from './map';
import { Ball } from './ball';
import { RightGoal } from './rightGoal';
import { LeftGoal } from './leftGoal';
import { Camera } from './camera';

import { User } from './socket';
import { KeysMap } from './../../shared/keysHandler';

export class Game {
    private map!: Map;
    private players: Player[] = [];
    private ball!: Ball;
    private leftGoal!: LeftGoal;
    private rightGoal!: RightGoal;
    private keysMap: KeysMap = {};

    constructor() {
        this.initHandlers();
        this.initCanvas();
        this.initEntities();
        this.initCamera();
        this.initEvents();
        User.socket.on('game::step', (data: IWorldPostStep) => {
            if (data.playersToAdd != null) {
                data.playersToAdd.forEach(player => {
                    const isMe = player.socketId === User.socket.id;
                    this.players.push(new Player(player.nick, player.avatar, { x: player.position[0], y: player.position[1] }, player.socketId, player.team));
                    if (isMe) {
                        Camera.updatePos({ x: player.position[0], y: player.position[1] });
                    }
                });
            }

            if (data.playersToRemove != null) {
                data.playersToRemove.forEach(socketId => {
                    const idx = this.players.findIndex(player => socketId === player.socketId);
                    if (idx !== -1) {
                        this.players.splice(idx, 1);
                    }
                });
            }
            if (data.playersMoving != null) {
                data.playersMoving.forEach(dataPlayer => {
                    const player = this.players.find(player => player.socketId === dataPlayer.socketId);
                    if (player) {
                        player.pos.x = dataPlayer.position[0];
                        player.pos.y = dataPlayer.position[1];
                        if (dataPlayer.socketId === User.socket.id) {
                            Camera.updatePos({ ...player.pos });
                        }
                    }
                });
            }
            if (data.playersShooting != null) {
                data.playersShooting.forEach(dataPlayer => {
                    const player = this.players.find(player => player.socketId === dataPlayer.socketId);
                    if (player) {
                        player.shooting = dataPlayer.shooting;
                    }
                });
            }
            if (data.ballMoving != null) {
                this.ball.pos.x = data.ballMoving.position[0];
                this.ball.pos.y = data.ballMoving.position[1];
            }
        });
    }

    private initEvents(): void {
        User.socket.on('game::reset', (data: IWorldReset) => {
            this.ball.pos = { x: data.ball.position[0], y: data.ball.position[1] };
            data.players.forEach(dataPlayer => {
                const player = this.players.find(player => player.socketId === dataPlayer.socketId);
                if (player) {
                    player.pos.x = dataPlayer.position[0];
                    player.pos.y = dataPlayer.position[1];
                } 
            });
        });
        User.socket.emit('game::player-joins')
        User.socket.on('game::init-data', (data: IRoomGameData) => {
            this.players = data.players.map(p => new Player(p.nick, p.avatar, { x: p.position[0], y: p.position[1], }, p.socketId, p.team));
            this.ball.pos = { x: data.ball.position[0], y: data.ball.position[1] };
        });

        User.socket.on('game::player-shooting', (data: IPlayerShooting) => {
            const player = this.players.find(player => player.socketId === data.socketId);
            if (player) {
                player.shooting = data.shooting;
            }
        });
    }

    private initHandlers(): void {
        KeysHandler.bindHandler((keysMap: KeysMap) => {
            const player = this.players.find(player => player.socketId === User.socket.id);
            if (!player) return;
            player.shooting = Boolean(keysMap.shoot);
            player.dash(Boolean(keysMap.dash));

            const deltaKeysMap: Partial<KeysMap> = {};
            for (const key in keysMap) {
                if (this.keysMap[key] === void 0) {
                    deltaKeysMap[key] = keysMap[key];
                } else if (this.keysMap[key] !== keysMap[key]) {
                    deltaKeysMap[key] = keysMap[key];
                }
            }
            this.keysMap = keysMap;

            if (Object.keys(deltaKeysMap).length > 0) {
                User.socket.emit('game::player-key', deltaKeysMap as KeysMap);
            }
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
    }

    private initCamera(): void {
        Camera.setBounduary(getOffset(this.map.outerPos, map_config.outerSize));
    }

    public run(): void {
        this.render();
    }

    public dispose(): void {
        User.socket.off('game::init-data');
        User.socket.off('game::step');
        User.socket.off('game::reset');
        User.socket.off('game::player-shooting');

        Canvas.removeCanvas();
        KeysHandler.clearHandler();
        this.players.forEach(player => player.dispose());
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