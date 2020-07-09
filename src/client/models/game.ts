import { MapKind, CameraKind } from '../../shared/callibration';
import { IRoomGameData,  IWorldPostStep, IWorldReset, IRoomUser } from '../../shared/events';
import { KeysHandler, KeysMap } from '../../shared/keysHandler';

import { Canvas } from './canvas';
import { Player } from './player';
import { Map } from './map';
import { Ball } from './ball';
import { RightGoal } from './rightGoal';
import { LeftGoal } from './leftGoal';
import { Camera } from './camera';

import { User } from './socket';
import { playSound, loopSound } from '../view/utils';


export class Game {
    private map!: Map;

    private players: Player[] = [];
    private ball!: Ball;
    private leftGoal!: LeftGoal;
    private rightGoal!: RightGoal;
    private keysMap: KeysMap = {};

    private breakSoundLoop: () => void;
    constructor(private mapKind: MapKind) {
        this.breakSoundLoop = loopSound(`#background-sound`, 13500);
        this.initHandlers();
        this.initCanvas();
        this.initEntities();
        this.initCamera();
        this.initEvents();
        User.socket.on('room::game::step', (data: IWorldPostStep) => {
            if (data.playersToAdd != null) {
                data.playersToAdd.forEach(player => {
                    this.players.push(new Player(this.mapKind, player.nick, player.avatar, { x: player.position[0], y: player.position[1] }, player.socketId, player.team));
                    this.updateCamera();
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
                    }
                    this.updateCamera();
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
                this.updateCamera();
            }
        });
        this.updateCamera();
    }

    private initEvents(): void {
        User.socket.on('room::game::reset', (data: IWorldReset) => {
            this.ball.pos = { x: data.ball.position[0], y: data.ball.position[1] };
            data.players.forEach(dataPlayer => {
                const player = this.players.find(player => player.socketId === dataPlayer.socketId);
                if (player) {
                    player.pos.x = dataPlayer.position[0];
                    player.pos.y = dataPlayer.position[1];
                } 
            });
            this.updateCamera();
        });
        User.socket.on('room::game::shoot-sound', (shootSound: number) => {
            playSound(`#shoot-sound-${shootSound}`)
        });
        User.socket.emit('room::game::user-joined')
        User.socket.on('room::game::init-data', (data: IRoomGameData) => {
            if (!data) return;
            this.players = data.players.map(p => new Player(this.mapKind, p.nick, p.avatar, { x: p.position[0], y: p.position[1], }, p.socketId, p.team));
            this.ball.pos = { x: data.ball.position[0], y: data.ball.position[1] };
            this.updateCamera();
        });

        User.socket.on('room::user::afk-changed', (user: IRoomUser) => {
            const player = this.players.find(player => user.socketId === player.socketId);
            if (!player) return;
            player.afk = user.afk;
        });
    }

    private initHandlers(): void {
        KeysHandler.bindHandler((keysMap: KeysMap) => {
            if (User.afk) return

            if (keysMap.camera1) {
                Canvas.changeCamera(CameraKind.Close);
            } else if (keysMap.camera2) {
                Canvas.changeCamera(CameraKind.Medium);
            } else if (keysMap.camera3) {
                Canvas.changeCamera(CameraKind.Far);
            }
            this.updateCamera();
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
                User.socket.emit('room::game::player-key', deltaKeysMap as KeysMap);
            }
        });
    }
    
    private initCanvas(): void {
        Canvas.createCanvas();
    }

    private initEntities(): void {
        this.map = new Map(this.mapKind);
        this.leftGoal = new LeftGoal(this.mapKind);
        this.rightGoal = new RightGoal(this.mapKind);
        this.ball = new Ball(this.mapKind);
    }

    private initCamera(): void {
        Camera.init(this.mapKind);
    }

    private updateCamera(): void {
        const player = this.players.find(player => player.socketId === User.socket.id);
        if (player) {
            Camera.updatePos(player.pos , this.ball.pos);
        } else {
            Camera.updatePos(this.ball.pos, this.ball.pos);
        }
    }

    public run(): void {
        this.render();
    }

    public dispose(): void {
        User.socket.off('room::game::init-data');
        User.socket.off('room::game::step');
        User.socket.off('room::game::reset');
        User.socket.off('room::user::afk-changed');
        User.socket.off('room::game::shoot-sound');

        Canvas.removeCanvas();
        KeysHandler.clearHandler();
        this.players.forEach(player => player.dispose());
        this.breakSoundLoop();
    }

    public render(): void {
        Canvas.clearCanvas();
        Camera.translateStart();
        this.map.render();
        this.leftGoal.render();
        this.rightGoal.render();
        this.players.forEach(player => {
            player.renderInfo();
        });
        this.players.forEach(player => {
            player.render();
        });
        this.ball.render();

        Camera.translateEnd();

    }
}