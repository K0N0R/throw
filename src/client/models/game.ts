import { Canvas } from './canvas';
import { KeysHandler, Keys } from './keysHandler';
import { Player } from './player';
import { Map } from './map';
import { Ball } from './ball';
import { RightGoal } from './rightGoal';
import { LeftGoal } from './leftGoal';
import { Camera } from './camera';
import { goal, map, player, ball } from './callibration';
import { getOffset } from './../utils/offset';


export class Game {
    private socket: SocketIOClient.Socket;

    private map!: Map;
    private players: Player[] = [];
    private ball!: Ball;
    private leftGoal!: LeftGoal;
    private rightGoal!: RightGoal;

    constructor( socket: SocketIOClient.Socket) {
        this.socket = socket;
        this.initHandlers();
        this.initEvents();
        this.initCanvas();
        this.initEntities();
        this.initCamera();
    }

    private initHandlers(): void {
        KeysHandler.bindEvents();

        KeysHandler.add(Keys.Up, (pressed: boolean) => { this.socket.emit('player::key', { key: Keys.Up, pressed: pressed }) });
        KeysHandler.add(Keys.Down, (pressed: boolean) => { this.socket.emit('player::key', { key: Keys.Down, pressed: pressed }) });
        KeysHandler.add(Keys.Left, (pressed: boolean) => { this.socket.emit('player::key', { key: Keys.Left, pressed: pressed }) });
        KeysHandler.add(Keys.Right, (pressed: boolean) => { this.socket.emit('player::key', { key: Keys.Right, pressed: pressed }) });
        KeysHandler.add(Keys.Shift, (pressed: boolean) => { this.socket.emit('player::key', { key: Keys.Shift, pressed: pressed }) });
        KeysHandler.add(Keys.X, (pressed: boolean) => {
            this.socket.emit('player::key', { key: Keys.X, pressed: pressed });
            const plr = this.players.find(plr => plr.socketId === this.socket.id);
            if (plr) plr.shootingStrong = pressed;
        });
        KeysHandler.add(Keys.C, (pressed: boolean) => {
            this.socket.emit('player::key', { key: Keys.C, pressed: pressed });
            const plr = this.players.find(plr => plr.socketId === this.socket.id);
            if (plr) plr.shootingWeak = pressed;
        });

    }

    private initEvents(): void {
        this.socket.on('player::move', (data: { id: string, position: [number, number] }) => {
            const plr = this.players.find(plr => plr.socketId === data.id);
            if (plr) {
                plr.pos.x = data.position[0];
                plr.pos.y = data.position[1];
                if (data.id === this.socket.id) {
                    Camera.updatePos({ ...plr.pos });
                }
            }
        });
        this.socket.on('ball::move', (data: { position:[number, number] }) => {
            this.ball.pos.x = data.position[0];
            this.ball.pos.y = data.position[1];
        });

        this.socket.on('player::team-left', (data: { id: string; position:[number, number], teamLeft: { id: string; position:[number, number] }[], teamRight: { id: string; position:[number, number] }[] } ) => {
            this.players.push(new Player({x: data.position[0], y: data.position[1]}, data.id, '#8F1218'));
            Camera.updatePos({x: data.position[0], y: data.position[1]});
            data.teamLeft.forEach(p => {
                const idx = this.players.findIndex(plr => p.id === plr.socketId);
                if (idx === -1)
                this.players.push(new Player({x: p.position[0], y: p.position[1]}, p.id, '#8F1218'));
            });
            data.teamRight.forEach(p => {
                const idx = this.players.findIndex(plr => p.id === plr.socketId);
                if (idx === -1)
                this.players.push(new Player({x: p.position[0], y: p.position[1]}, p.id, '#4663A0'));
            });
        });

        this.socket.on('player::team-right', (data: { id: string; position:[number, number], teamLeft: { id: string; position:[number, number] }[], teamRight: { id: string; position:[number, number] }[] } ) => {
            this.players.push(new Player({x: data.position[0], y: data.position[1]}, data.id, '#4663A0'));
            Camera.updatePos({x: data.position[0], y: data.position[1]});
            data.teamLeft.forEach(p => {
                const idx = this.players.findIndex(plr => p.id === plr.socketId);
                if (idx === -1) this.players.push(new Player({x: p.position[0], y: p.position[1]}, p.id, '#8F1218'));
            });
            data.teamRight.forEach(p => {
                const idx = this.players.findIndex(plr => p.id === plr.socketId);
                if (idx === -1) this.players.push(new Player({x: p.position[0], y: p.position[1]}, p.id, '#4663A0'));
            });
        });
    }

    private initCanvas(): void {
        Canvas.createCanvas();
    }

    private initEntities(): void {
        this.map = new Map();
        this.leftGoal = new LeftGoal({ x: this.map.pos.x - goal.size.width, y: this.map.pos.y + map.size.height / 2 - goal.size.height / 2 });
        this.rightGoal = new RightGoal({ x: this.map.pos.x + map.size.width, y: this.map.pos.y + map.size.height / 2 - goal.size.height / 2 });
        this.ball = new Ball({x: this.map.pos.x + map.size.width / 2, y: this.map.pos.y + map.size.height / 2 });
    }

    private initCamera(): void {
        Camera.setBounduary(getOffset(this.map.outerPos, map.outerSize));
    }

    public run() {
        this.logic();
        this.render();
    }

    private logic(): void {
        KeysHandler.reactOnKeys();
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