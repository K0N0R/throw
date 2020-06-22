import { goal_config, map_config } from './../../shared/callibration';
import { getOffset } from './../../shared/offset';
import { Keys } from './../../shared/keys';
import { IRoomGameData, IPlayerKey, IPlayerShooting, IWorldPostStep, IWorldReset } from './../../shared/events';

import { Canvas } from './canvas';
import { KeysHandler } from './../../shared/keysHandler';
import { Player } from './player';
import { Map } from './map';
import { Ball } from './ball';
import { RightGoal } from './rightGoal';
import { LeftGoal } from './leftGoal';
import { Camera } from './camera';
import { Score } from './score';

import { Socket } from './socket';

export class Game {
    private map!: Map;
    private players: Player[] = [];
    private ball!: Ball;
    private leftGoal!: LeftGoal;
    private rightGoal!: RightGoal;
    private score!: Score;
    private keyMap: IPlayerKey = {};

    constructor() {
        this.initHandlers();
        this.initCanvas();
        this.initEntities();
        this.initCamera();
        this.initEvents();
        Socket.socket.emit('player::init');
        Socket.socket.on('world::postStep', (data: IWorldPostStep) => {
            if (data.playersToAdd != null) {
                data.playersToAdd.forEach(player => {
                    const isMe = player.socketId === Socket.socket.id;
                    this.players.push(new Player(player.nick, player.avatar, { x: player.position[0], y: player.position[1] }, player.socketId, player.team, isMe));
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
                        if (dataPlayer.socketId === Socket.socket.id) {
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
        Socket.socket.on('world::reset', (data: IWorldReset) => {
            this.ball.pos = { x: data.ball.position[0], y: data.ball.position[1] };
            data.players.forEach(dataPlayer => {
                const player = this.players.find(player => player.socketId === dataPlayer.socketId);
                if (player) {
                    player.pos.x = dataPlayer.position[0];
                    player.pos.y = dataPlayer.position[1];
                } 
            });
        });
        Socket.socket.emit('room::user-created-game')
        Socket.socket.on('room::game-data', (data: IRoomGameData) => {
            this.players = data.players.map(p => new Player(p.nick, p.avatar, { x: p.position[0], y: p.position[1], }, p.socketId, p.team, Socket.socket.id === p.socketId));
            this.ball.pos = { x: data.ball.position[0], y: data.ball.position[1] };
            this.score.updateScore(data.score);

        });

        Socket.socket.on('player::shooting', (data: IPlayerShooting) => {
            const player = this.players.find(player => player.socketId === data.socketId);
            if (player) {
                player.shooting = data.shooting;
            }
        });
    }

    private initHandlers(): void {
        const handleShooting = (player: Player, pressed: { [param: number]: boolean }) => {
            player.shooting = pressed[Keys.X];
        };
        const handleDashing = (player: Player, pressed: { [param: number]: boolean }) => {
            player.dash(pressed[Keys.Shift]);
        };
        KeysHandler.bindHandler((pressed: { [param: number]: boolean }) => {
            const player = this.players.find(player => player.socketId === Socket.socket.id);
            if (player) {
                handleShooting(player, pressed);
                handleDashing(player, pressed);

                const deltaKeysMap: IPlayerKey = {};
                for(const key in pressed) {
                    if (this.keyMap[key] == void 0) {
                        deltaKeysMap[key] = pressed[key];
                    } else if (this.keyMap[key] !== pressed[key]) {
                        deltaKeysMap[key] = pressed[key];
                    }
                }
                this.keyMap = pressed;

                if (Object.keys(deltaKeysMap).length > 0) {
                    Socket.socket.emit('player::key', deltaKeysMap as IPlayerKey);
                }
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
        this.score = new Score();
    }

    private initCamera(): void {
        Camera.setBounduary(getOffset(this.map.outerPos, map_config.outerSize));
    }

    public run(): void {
        this.render();
    }

    public dispose(): void {
        Socket.socket.off('world::postStep');
        Socket.socket.off('room::game-data');
        Socket.socket.off('player::shooting');
        Socket.socket.off('world::reset');
        Canvas.removeCanvas();
        KeysHandler.clearHandler();
        if (this.score) this.score.dispose();
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
        this.score.render();

        Camera.translateEnd();

    }
}