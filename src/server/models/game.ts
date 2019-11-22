import * as p2 from 'p2';

import io from 'socket.io';

import { Player } from './player';
import { Map } from './map';
import { Ball } from './ball';
import { RightGoal } from './rightGoal';
import { LeftGoal } from './leftGoal';
import { goal, map, player, ball } from './callibration';
import { Dictionary } from '../utils/model';
import { getNormalizedVector, getDistance } from '../utils/vector';
import { isMoving } from '../utils/body';
import { Team } from './team';

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
                players: this.players.map(plr => ({
                    socketId: plr.socket.id,
                    team: plr.team,
                    position: plr.body.position,
                })),
                ball: {
                    position: this.ball.body.position,
                }
            });
            const newPlayer = new Player(socket, this.mat.player)
            this.players.push(newPlayer);
            this.playerAddToTeam(newPlayer);
            this.playerAddToWorld(newPlayer);
            this.playerAddEvents(newPlayer);

            io.emit('player::add', {
                socketId: newPlayer.socket.id,
                team: newPlayer.team,
                position: newPlayer.body.position,
            });

            socket.on('disconnect', () => {
                this.playerDispose(newPlayer);
                io.emit('player::dispose', socket.id);
            });
        });
    }

    private playerAddToTeam(newPlayer: Player): void {
        const leftTeam = this.players.filter(plr => plr.team === Team.Left);
        const rightTeam = this.players.filter(plr => plr.team === Team.Right);
        if (leftTeam.length > rightTeam.length) {
            // assing to right
            newPlayer.body.position[0] = map.size.width - player.radius;
            newPlayer.body.position[1] = map.size.height / 2
            newPlayer.team = Team.Right;
        } else {
            // assign to left
            newPlayer.body.position[0] = player.radius;
            newPlayer.body.position[1] = map.size.height / 2;
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
                this.io.emit('player::move', { id: newPlayer.socket.id, position: newPlayer.body.position });
            }
        });
        playerEvents.events.push(() => {
            if (newPlayer.shootingStrong || newPlayer.shootingWeak) {
                const playerPos = { x: newPlayer.body.position[0], y: newPlayer.body.position[1] };
                const ballPos = { x: this.ball.body.position[0], y: this.ball.body.position[1] };
                const minDistance = player.radius + ball.radius;
                const shootingDistance = 1;
                if (getDistance(playerPos, ballPos) - minDistance < shootingDistance) {
                    const shootingVector = getNormalizedVector(
                        { x: newPlayer.body.position[0], y: newPlayer.body.position[1] },
                        { x: this.ball.body.position[0], y: this.ball.body.position[1] }
                    );
                    if (newPlayer.shootingStrong && newPlayer.shootingWeak) {
                        this.ball.body.velocity[0] += shootingVector.x * (player.shootingStrong + player.shootingWeak) / 2;
                        this.ball.body.velocity[1] += shootingVector.y * (player.shootingStrong + player.shootingWeak) / 2;
                    } else if (newPlayer.shootingStrong) {
                        this.ball.body.velocity[0] += shootingVector.x * player.shootingStrong;
                        this.ball.body.velocity[1] += shootingVector.y * player.shootingStrong;
                    } else if (newPlayer.shootingWeak) {
                        this.ball.body.velocity[0] += shootingVector.x * player.shootingWeak;
                        this.ball.body.velocity[1] += shootingVector.y * player.shootingWeak;
                    }
                }
            }
        });
        this.playerEvents.push(playerEvents);
    }

    private playerDispose(oldPlayer: Player): void {
        this.world.removeBody(oldPlayer.body);
        const plrIdx = this.players.indexOf(oldPlayer);
        this.players.splice(plrIdx, 1)
        const eventIdx = this.playerEvents.findIndex(playerEvent => playerEvent.player === oldPlayer);
        this.playerEvents.splice(eventIdx, 1);
    }

    private initEntities(): void {
        this.map = new Map(this.mat.map);
        this.leftGoal = new LeftGoal({ x: this.map.pos.x - goal.size.width, y: this.map.pos.y + map.size.height / 2 - goal.size.height / 2 }, this.mat.goal);
        this.rightGoal = new RightGoal({ x: this.map.pos.x + map.size.width, y: this.map.pos.y + map.size.height / 2 - goal.size.height / 2 }, this.mat.goal);
        this.ball = new Ball([this.map.pos.x + map.size.width / 2, this.map.pos.y + map.size.height / 2], this.mat.ball);
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
                this.io.emit('ball::move', { position: this.ball.body.position });
            }
        })
    }

    private initWorldEvents(): void {
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