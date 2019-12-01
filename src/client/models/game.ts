import p2 from 'p2';

import { goal_config, map_config, player_config, ball_config } from './../../shared/callibration';
import { getOffset } from './../../shared/offset';
import { Keys } from './../../shared/keys';
import { IPlayerInit, IPlayerKey, IPlayerShooting, IWorldPostStep, IWorldReset } from './../../shared/events';
import { contact } from './../../shared/material';
import { getDistance, getNormalizedVector } from './../../shared/vector';

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

    private step!: {
        fixedTime: number;
        lastTime: number;
        maxSteps: number;
    };

    private world!: p2.World;

    private map!: Map;
    private players: Player[] = [];
    private ball!: Ball;
    private leftGoal!: LeftGoal;
    private rightGoal!: RightGoal;
    private score!: Score;
    private keyMap: IPlayerKey = {};

    constructor(socket: SocketIOClient.Socket) {
        this.socket = socket;

        this.step = {
            fixedTime: 4 / 60,
            lastTime: 0,
            maxSteps: 100,
        };

        this.initHandlers();
        this.initCanvas();
        this.initEntities();
        this.initWorld();
        this.initCamera();
        this.initEvents();
        this.socket.on('world::postStep', (data: IWorldPostStep) => {
            if (data.playersToAdd) {
                data.playersToAdd.forEach(player => {
                    const isMe = player.socketId === this.socket.id;
                    const newPlayer = new Player(player.socketId, player.position, player.team, isMe);
                    this.players.push(newPlayer);
                    this.world.addBody(newPlayer.body);
                    if (isMe) {
                        Camera.updatePos({ x: player.position[0], y: player.position[1] });
                    }
                });
            }
            if (data.playersToRemove) {
                data.playersToRemove.forEach(socketId => {
                    const idx = this.players.findIndex(player => socketId === player.socketId);
                    this.world.removeBody(this.players[idx].body);
                    if (idx !== -1) {
                        this.players.splice(idx, 1);
                    }
                });
            }
            if (data.scoreLeft || data.scoreRight) {
                this.score.updateScore({
                    left: data.scoreLeft || null,
                    right: data.scoreRight || null
                });
            }
        });
    }

    private initEvents(): void {
        this.socket.on('world::reset', (data: IWorldReset) => {
            this.ball.body.position = data.ball.position;
            data.players.forEach(dataPlayer => {
                const player = this.players.find(player => player.socketId === dataPlayer.socketId);
                if (player) {
                    player.body.position = dataPlayer.position;
                } 
            });
        });

        this.socket.on('player::init', (data: IPlayerInit) => {
            const players = data.players.map(p => new Player(p.socketId, p.position, p.team));
            this.players.push(...players);
            players.forEach(player => this.world.addBody(player.body));
            this.ball.body.position = data.ball.position;
            this.score.updateScore(data.score);
        });

        this.socket.on('player::shooting', (data: IPlayerShooting) => {
            const player = this.players.find(player => player.socketId === data.socketId);
            if (player) {
                player.shooting = data.shooting;
            }
        });

        this.socket.on('players::key', (data: { socketId: string, keyMap: IPlayerKey }) => {
            if (data.socketId !== this.socket.id) {
                const player = this.players.find(player => player.socketId === data.socketId);
                if (player) {
                    for (let key in data.keyMap) {
                        player.keyMap[key] = data.keyMap[key];
                    }
                }
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
                this.keyMap
                handleShooting(player, pressed);
                handleSprinting(player, pressed);

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
                    for (let key in deltaKeysMap) {
                        player.keyMap[key] = deltaKeysMap[key];
                    }
                    this.socket.emit('player::key', deltaKeysMap as IPlayerKey);
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
        this.ball = new Ball([this.map.pos.x + map_config.size.width / 2, this.map.pos.y + map_config.size.height / 2]);
        this.score = new Score();
    }

    private initWorld(): void {
        this.world = new p2.World({
            gravity: [0, 0]
        });

        this.world.addBody(this.map.topBody);
        this.world.addBody(this.map.botBody);
        this.world.addBody(this.map.borderBody);

        this.world.addBody(this.leftGoal.borderBody);
        this.world.addBody(this.leftGoal.postBody);

        this.world.addBody(this.rightGoal.borderBody);
        this.world.addBody(this.rightGoal.postBody);
        this.world.addBody(this.ball.body);

        this.world.addContactMaterial(contact.goalBallContactMaterial);
        this.world.addContactMaterial(contact.mapBallContactMaterial);
        this.world.addContactMaterial(contact.mapPlayerContactMaterial);
        this.world.addContactMaterial(contact.playerBallContactMaterial);
    }

    private initCamera(): void {
        Camera.setBounduary(getOffset(this.map.outerPos, map_config.outerSize));
    }

    public run() {
        this.world.step(this.step.fixedTime);
        this.players.forEach(player => {
            player.logic();
        });

        this.players
            .filter((player) => player.shooting)
            .forEach(player => {
                const playerPos = { x: player.body.position[0], y: player.body.position[1] };
                const ballPos = { x: this.ball.body.position[0], y: this.ball.body.position[1] };
                const minDistance = player_config.radius + ball_config.radius;
                const shootingDistance = 1;
                if (getDistance(playerPos, ballPos) - minDistance < shootingDistance) {
                    const shootingVector = getNormalizedVector(
                        { x: player.body.position[0], y: player.body.position[1] },
                        { x: this.ball.body.position[0], y: this.ball.body.position[1] }
                    );
                    this.ball.body.velocity[0] += shootingVector.x * player_config.shooting;
                    this.ball.body.velocity[1] += shootingVector.y * player_config.shooting;
                }
            });

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