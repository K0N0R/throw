import { goal, map } from './../../shared/callibration';
import { getOffset } from './../../shared/offset';
import { Team } from './../../shared/team';
import { Keys } from './../../shared/keys';

import { Canvas } from './canvas';
import { KeysHandler } from './keysHandler';
import { Player } from './player';
import { Map } from './map';
import { Ball } from './ball';
import { RightGoal } from './rightGoal';
import { LeftGoal } from './leftGoal';
import { Camera } from './camera';

export class Game {
    private socket: SocketIOClient.Socket;

    private map!: Map;
    private players: Player[] = [];
    private ball!: Ball;
    private leftGoal!: LeftGoal;
    private rightGoal!: RightGoal;

    constructor(socket: SocketIOClient.Socket) {
        this.socket = socket;
        this.initHandlers();
        this.initCanvas();
        this.initEntities();
        this.initCamera();
        this.initEvents();
        this.socket.on('world::postStep', () => {
            this.run();
        });
    }

    private initEvents(): void {
        this.socket.on('player::init', (data: { players: { socketId: string; team: Team; position: [number, number] }[]; ball: { position: [number, number] } }) => {
            this.players.push(...data.players.map(p => new Player({ x: p.position[0], y: p.position[1] }, p.socketId, p.team)));
            this.ball.pos = { x: data.ball.position[0], y: data.ball.position[1] };
        });

        this.socket.on('player::add', (data: { socketId: string; team: Team; position: [number, number] }) => {
            this.players.push(new Player({ x: data.position[0], y: data.position[1] }, data.socketId, data.team));
            if(data.socketId === this.socket.id) {
                Camera.updatePos({ x: data.position[0], y: data.position[1] });
            }
        });

        this.socket.on('player::dispose', (socketId: string) => {
            const idx = this.players.findIndex(plr => plr.socketId === socketId);
            this.players.splice(idx, 1);
        });

        this.socket.on('player::move', (data: { socketId: string, position: [number, number] }) => {
            const plr = this.players.find(plr => plr.socketId === data.socketId);
            if (plr) {
                plr.pos.x = data.position[0];
                plr.pos.y = data.position[1];
                if (data.socketId === this.socket.id) {
                    Camera.updatePos({ ...plr.pos });
                }
            }
        });

        this.socket.on('player::shooting', (data: { socketId: string, shootingWeak: boolean, shootingStrong: boolean }) => {
            const plr = this.players.find(plr => plr.socketId === data.socketId);
            if (plr) {
                plr.shootingStrong = data.shootingStrong !== void 0 ? data.shootingStrong : plr.shootingStrong;
                plr.shootingWeak = data.shootingWeak !== void 0 ? data.shootingWeak : plr.shootingWeak;
            }
        });

        this.socket.on('ball::move', (data: { position: [number, number] }) => {
            this.ball.pos.x = data.position[0];
            this.ball.pos.y = data.position[1];
        });
    }

    private initHandlers(): void {
        KeysHandler.bindEvents((pressed: { [param: number]: boolean }) => {
            this.socket.emit('player::key', pressed);
            const plr = this.players.find(plr => plr.socketId === this.socket.id);
            if (plr) {
                plr.shootingWeak = pressed[Keys.C];
                plr.shootingStrong = pressed[Keys.X];
            };
        });
    }
    
    private initCanvas(): void {
        Canvas.createCanvas();
    }

    private initEntities(): void {
        this.map = new Map();
        this.leftGoal = new LeftGoal({ x: this.map.pos.x - goal.size.width, y: this.map.pos.y + map.size.height / 2 - goal.size.height / 2 });
        this.rightGoal = new RightGoal({ x: this.map.pos.x + map.size.width, y: this.map.pos.y + map.size.height / 2 - goal.size.height / 2 });
        this.ball = new Ball({ x: this.map.pos.x + map.size.width / 2, y: this.map.pos.y + map.size.height / 2 });
    }

    private initCamera(): void {
        Camera.setBounduary(getOffset(this.map.outerPos, map.outerSize));
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