import * as p2 from 'p2';

import io from 'socket.io';

import { Player } from './player';
import { Map } from './map';
import { Ball } from './ball';
import { RightGoal } from './rightGoal';
import { LeftGoal } from './leftGoal';
import { goal_config, map_config, player_config, ball_config, canvas_config, game_config } from './../../shared/callibration';
import { Dictionary } from './../../shared/model';
import { getNormalizedVector, getDistance } from './../../shared/vector';
import { isMoving } from '../../shared/body';
import { Team } from './../../shared/team';
import { Keys } from './../../shared/keys';
import { isContact } from './../../shared/body';
import { IPlayerDispose, IPlayerAdd, IPlayerInit, IPlayerKey, IPlayerMove, IPlayerShooting, IBallMove, IScoreLeft, IScoreRight, IWorldReset } from './../../shared/events';

export class Game {
    private io: io.Server;

    private step: {
        fixedTime: number;
        lastTime: number;
        maxSteps: number;
    };

    private world!: p2.World;
    private mat: Dictionary<p2.Material> = {};
    private contactMat: Dictionary<p2.ContactMaterial> = {};

    private map!: Map;
    private players: Player[] = [];
    private ball!: Ball;
    private leftGoal!: LeftGoal;
    private rightGoal!: RightGoal;

    private worldEvents: (() => void)[] = [];
    private ballEvents: (() => void)[] = [];
    private playerEvents: { player: Player, events: Function[] }[] = [];

    private score = { left: 0, right: 0 };
    private reseting: boolean;

    constructor(io: io.Server, intervalTime: number) {
        this.step = {
            fixedTime: intervalTime / 60,
            lastTime: 0,
            maxSteps: 10,
        };

        this.initEntities();
        this.initWorld();
        this.initConnection(io);
    }

    private initConnection(io: io.Server): void {
        this.io = io;
        // mozliwe ze połączenie będzie jeszcze wczesniej nawiazywane
        io.on('connection', (socket) => {
            socket.emit('player::init', {
                players: this.players.map(player => ({
                    socketId: player.socket.id,
                    team: player.team,
                    position: player.body.position,
                })),
                ball: {
                    position: this.ball.body.position,
                },
                score: this.score
            } as IPlayerInit);
            const newPlayer = new Player(socket, this.mat.player)
            this.players.push(newPlayer);
            this.playerAddToTeam(newPlayer);
            this.playerAddToWorld(newPlayer);
            this.playerAddEvents(newPlayer);

            io.emit('player::add', {
                socketId: newPlayer.socket.id,
                team: newPlayer.team,
                position: newPlayer.body.position,
            } as IPlayerAdd);

            socket.on('disconnect', () => {
                this.playerDispose(newPlayer);
                io.emit('player::dispose', { socketId: socket.id } as IPlayerDispose);
            });

            socket.on('player::key', (data: IPlayerKey) => {
                for (let key in data) {
                    switch (Number(key)) {
                        case Keys.Up:
                        case Keys.Down:
                        case Keys.Left:
                        case Keys.Right:
                            if (data[key]) newPlayer.movementKeysHandler(Number(key));
                            break;
                        case Keys.Shift:
                            newPlayer.sprintHandler(data[key]);
                            break;
                        case Keys.X:
                            newPlayer.shootingStrongHandler(data[key]);
                            this.io.emit('player::shooting', { socketId: newPlayer.socket.id, shootingStrong: data[key] } as IPlayerShooting);
                            break;
                        case Keys.C:
                            newPlayer.shootingWeakHandler(data[key]);
                            this.io.emit('player::shooting', { socketId: newPlayer.socket.id, shootingWeak: data[key] } as IPlayerShooting);
                            break;
                    }
                }
            });
        });
    }

    private playerAddToTeam(newPlayer: Player): void {
        const leftTeam = this.players.filter(player => player.team === Team.Left);
        const rightTeam = this.players.filter(player => player.team === Team.Right);
        if (leftTeam.length > rightTeam.length) {
            // assing to right
            newPlayer.body.position[0] = canvas_config.size.width - map_config.border;
            newPlayer.body.position[1] = canvas_config.size.height / 2;
            newPlayer.team = Team.Right;
        } else {
            // assign to left
            newPlayer.body.position[0] = map_config.border;
            newPlayer.body.position[1] = canvas_config.size.height / 2;
            newPlayer.team = Team.Left;
        }
    }

    private playerAddToWorld(newPlayer: Player): void {
        this.world.addBody(newPlayer.body);
    }

    private playerAddEvents(newPlayer: Player): void {
        const playerEvents = {
            player: newPlayer,
            events: []
        };
        playerEvents.events.push(() => {
            if (isMoving(newPlayer.body)) {
                this.io.emit('player::move', { socketId: newPlayer.socket.id, position: newPlayer.body.position } as IPlayerMove);
            }
        });
        playerEvents.events.push(() => {
            if (newPlayer.shootingStrong || newPlayer.shootingWeak) {
                const playerPos = { x: newPlayer.body.position[0], y: newPlayer.body.position[1] };
                const ballPos = { x: this.ball.body.position[0], y: this.ball.body.position[1] };
                const minDistance = player_config.radius + ball_config.radius;
                const shootingDistance = 1;
                if (getDistance(playerPos, ballPos) - minDistance < shootingDistance) {
                    const shootingVector = getNormalizedVector(
                        { x: newPlayer.body.position[0], y: newPlayer.body.position[1] },
                        { x: this.ball.body.position[0], y: this.ball.body.position[1] }
                    );
                    if (newPlayer.shootingStrong && newPlayer.shootingWeak) {
                        this.ball.body.velocity[0] += shootingVector.x * (player_config.shootingStrong + player_config.shootingWeak) / 2;
                        this.ball.body.velocity[1] += shootingVector.y * (player_config.shootingStrong + player_config.shootingWeak) / 2;
                    } else if (newPlayer.shootingStrong) {
                        this.ball.body.velocity[0] += shootingVector.x * player_config.shootingStrong;
                        this.ball.body.velocity[1] += shootingVector.y * player_config.shootingStrong;
                    } else if (newPlayer.shootingWeak) {
                        this.ball.body.velocity[0] += shootingVector.x * player_config.shootingWeak;
                        this.ball.body.velocity[1] += shootingVector.y * player_config.shootingWeak;
                    }
                }
            }
        });
        this.playerEvents.push(playerEvents);
    }

    private playerDispose(oldPlayer: Player): void {
        this.world.removeBody(oldPlayer.body);
        const playerIdx = this.players.indexOf(oldPlayer);
        this.players.splice(playerIdx, 1)
        const eventIdx = this.playerEvents.findIndex(playerEvent => playerEvent.player === oldPlayer);
        this.playerEvents.splice(eventIdx, 1);
    }

    private initEntities(): void {
        this.map = new Map(this.mat.map);
        this.leftGoal = new LeftGoal({ x: this.map.pos.x - goal_config.size.width, y: this.map.pos.y + map_config.size.height / 2 - goal_config.size.height / 2 }, this.mat.goal);
        this.rightGoal = new RightGoal({ x: this.map.pos.x + map_config.size.width, y: this.map.pos.y + map_config.size.height / 2 - goal_config.size.height / 2 }, this.mat.goal);
        this.ball = new Ball([this.map.pos.x + map_config.size.width / 2, this.map.pos.y + map_config.size.height / 2], this.mat.ball);
    }

    private initWorld(): void {
        this.world = new p2.World({
            gravity: [0, 0]
        });
        this.initMaterials();

        this.world.addBody(this.map.topBody);
        this.world.addBody(this.map.botBody);
        this.world.addBody(this.map.borderBody);

        this.world.addBody(this.leftGoal.borderBody);
        this.world.addBody(this.leftGoal.postBody);

        this.world.addBody(this.rightGoal.borderBody);
        this.world.addBody(this.rightGoal.postBody);
        this.world.addBody(this.ball.body);

        this.initWorldEvents();
        this.initBallEvents();
    }

    private initMaterials(): void {
        this.mat.map = new p2.Material();
        this.mat.player = new p2.Material();
        this.mat.ball = new p2.Material();
        this.mat.goal = new p2.Material();
        this.contactMat.mapPlayer = new p2.ContactMaterial(this.mat.map, this.mat.player, {
            friction: 1
        });
        this.contactMat.mapBall = new p2.ContactMaterial(this.mat.map, this.mat.ball, {
            friction: 0,
            restitution: 0.3
        });
        this.contactMat.goalBall = new p2.ContactMaterial(this.mat.goal, this.mat.ball, {
            friction: 2,
        });
        this.contactMat.playerBall = new p2.ContactMaterial(this.mat.player, this.mat.ball, {
            friction: 1
        });
        this.world.addContactMaterial(this.contactMat.mapBall);
        this.world.addContactMaterial(this.contactMat.playerBall);
        this.world.addContactMaterial(this.contactMat.goalBall);
        this.world.addContactMaterial(this.contactMat.mapPlayer);
    }

    private initBallEvents(): void {
        this.ballEvents.push(() => {
            if (isMoving(this.ball.body)) {
                this.io.emit('ball::move', { position: this.ball.body.position } as IBallMove);
            }
            if (this.ball.body.position[0] < this.map.pos.x && !this.reseting) {
                this.io.emit('score::right', { right: ++this.score.right } as IScoreRight);
                this.reseting = true;
                setTimeout(() => {
                    this.reset();
                }, game_config.goalResetTimeout);
            }
            if (this.ball.body.position[0] > this.map.pos.x + map_config.size.width && !this.reseting) {
                this.io.emit('score::left', { left: ++this.score.left } as IScoreLeft);
                this.reseting = true;
                setTimeout(() => {
                    this.reset();
                }, game_config.goalResetTimeout);
            }
        })
    }

    private initWorldEvents(): void {}

    private reset(): void {
        // ball reset
        this.ball.body.position[0] = this.map.pos.x + map_config.size.width / 2;
        this.ball.body.position[1] = this.map.pos.y + map_config.size.height / 2;
        this.ball.body.velocity[0] = 0;
        this.ball.body.velocity[1] = 0;

        // players reset
        const leftTeam = this.players.filter(player => player.team === Team.Left);
        const leftTeamX = this.map.pos.x + goal_config.size.width + player_config.radius;
        const leftTeamY = this.map.pos.y + map_config.size.height/2 - ((leftTeam.length -1) * (player_config.radius*2 + 10))/2
        leftTeam.forEach((player, idx) => {
            player.body.position[0] = leftTeamX;
            player.body.position[1] = leftTeamY + (player_config.radius*2 + 10) * idx;
        });
        const rightTeam = this.players.filter(player => player.team === Team.Right);
        const rightTeamX = this.map.pos.x + map_config.size.width - goal_config.size.width - player_config.radius;
        const rightTeamY = this.map.pos.y + map_config.size.height/2 - ((rightTeam.length -1) * (player_config.radius*2 + 10))/2
        rightTeam.forEach((player, idx) => {
            player.body.position[0] = rightTeamX;
            player.body.position[1] = rightTeamY + (player_config.radius*2 + 10) * idx;
        });

        // event
        this.io.emit('world::reset', ({
            players: this.players.map(player => ({
                socketId: player.socket.id,
                position: player.body.position,
            })),
            ball: {
                position: this.ball.body.position,
            },
        }) as IWorldReset);
        this.reseting = false;
    }

    public run(time: number) {
        this.worldStep(time);

        if (this.worldEvents.length) {
            this.worldEvents.forEach(event => event());
        }
        this.worldEvents.length = 0;

        if (this.playerEvents.length) {
            this.playerEvents.forEach(playerEvent => {
                playerEvent.events.forEach(event => event());
            });
        }
        this.ballEvents.forEach(event => event());
        this.io.emit('world::postStep');
    }

    private worldStep(time: number): void {

        // Move bodies forward in time
        this.world.step(this.step.fixedTime) //deltaTime, this.step.maxSteps);

        this.step.lastTime = time;
    }

}