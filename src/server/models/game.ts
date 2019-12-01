import p2 from 'p2';

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
import { IPlayerInit, IPlayerKey, IWorldReset, IWorldPostStep } from './../../shared/events';

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
    private playersToAdd: Player[] = [];
    private playersToRemove: Player[] = [];
    private ball!: Ball;
    private leftGoal!: LeftGoal;
    private rightGoal!: RightGoal;

    private score = { left: 0, right: 0 };
    private reseting: boolean;

    constructor(io: io.Server) {
        this.step = {
            fixedTime: game_config.interval / 60,
            lastTime: 0,
            maxSteps: 100,
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
                    socketId: player.socketId,
                    team: player.team,
                    position: player.body.position,
                })),
                ball: {
                    position: this.ball.body.position,
                },
                score: this.score
            } as IPlayerInit);
            const newPlayer = new Player(socket.id, this.mat.player)
            this.playersToAdd.push(newPlayer);

            socket.on('disconnect', () => {
                this.playersToRemove.push(newPlayer);
            });

            socket.on('player::key', (data: IPlayerKey) => {
                for (let key in data) {
                    newPlayer.keyMap[key] = data[key];
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

    private playerDispose(oldPlayer: Player): void {
        this.world.removeBody(oldPlayer.body);
        const playerIdx = this.players.indexOf(oldPlayer);
        this.players.splice(playerIdx, 1);
    }

    private initEntities(): void {
        this.initMaterials();
        this.map = new Map(this.mat.map);
        this.leftGoal = new LeftGoal({ x: this.map.pos.x - goal_config.size.width, y: this.map.pos.y + map_config.size.height / 2 - goal_config.size.height / 2 }, this.mat.goal, this.mat.map);
        this.rightGoal = new RightGoal({ x: this.map.pos.x + map_config.size.width, y: this.map.pos.y + map_config.size.height / 2 - goal_config.size.height / 2 }, this.mat.goal, this.mat.map);
        this.ball = new Ball([this.map.pos.x + map_config.size.width / 2, this.map.pos.y + map_config.size.height / 2], this.mat.ball);
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

        this.world.addContactMaterial(this.contactMat.mapBall);
        this.world.addContactMaterial(this.contactMat.playerBall);
        this.world.addContactMaterial(this.contactMat.goalBall);
        this.world.addContactMaterial(this.contactMat.mapPlayer);
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
            restitution: 0.5,
            stiffness: Number.MAX_VALUE
        });
        this.contactMat.goalBall = new p2.ContactMaterial(this.mat.goal, this.mat.ball, {
            friction: 5,
            restitution: 0,
        });
        this.contactMat.playerBall = new p2.ContactMaterial(this.mat.player, this.mat.ball, {
            friction: 1
        });
    }

    private reset(): void {
        // ball reset
        this.ball.body.position[0] = this.map.pos.x + map_config.size.width / 2;
        this.ball.body.position[1] = this.map.pos.y + map_config.size.height / 2;
        this.ball.body.velocity[0] = 0;
        this.ball.body.velocity[1] = 0;

        // players reset
        const leftTeam = this.players.filter(player => player.team === Team.Left);
        const leftTeamX = this.map.pos.x + goal_config.size.width + player_config.radius;
        const leftTeamY = this.map.pos.y + map_config.size.height / 2 - ((leftTeam.length - 1) * (player_config.radius * 2 + 10)) / 2
        leftTeam.forEach((player, idx) => {
            player.body.position[0] = leftTeamX;
            player.body.position[1] = leftTeamY + (player_config.radius * 2 + 10) * idx;
        });
        const rightTeam = this.players.filter(player => player.team === Team.Right);
        const rightTeamX = this.map.pos.x + map_config.size.width - goal_config.size.width - player_config.radius;
        const rightTeamY = this.map.pos.y + map_config.size.height / 2 - ((rightTeam.length - 1) * (player_config.radius * 2 + 10)) / 2
        rightTeam.forEach((player, idx) => {
            player.body.position[0] = rightTeamX;
            player.body.position[1] = rightTeamY + (player_config.radius * 2 + 10) * idx;
        });

        // event
        this.io.emit('world::reset', ({
            players: this.players.map(player => ({
                socketId: player.socketId,
                position: player.body.position,
            })),
            ball: {
                position: this.ball.body.position,
            },
        }) as IWorldReset);
        this.reseting = false;
    }

    public run() {
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

        this.worldStep();

        const playersToAdd = this.playersToAdd.map(player => {
            this.players.push(player);
            this.playerAddToTeam(player);
            this.playerAddToWorld(player);
            return {
                socketId: player.socketId,
                team: player.team,
                position: player.body.position,
            };
        });
        this.playersToAdd.length = 0;

        const playersToRemove = this.playersToRemove.map(player => {
            this.playerDispose(player);
            return player.socketId;
        })
        this.playersToRemove.length = 0;

        const playersMoving = this.players
            .filter(player => isMoving(player.body))
            .map(player => ({ socketId: player.socketId, position: player.body.position }));

        const ballMoving = isMoving(this.ball.body)
            ? { position: this.ball.body.position }
            : null;

        const scoreRight = !this.reseting && this.ball.body.position[0] < this.map.pos.x
            ? ++this.score.right
            : null;

        const scoreLeft = !this.reseting && this.ball.body.position[0] > this.map.pos.x + map_config.size.width
            ? ++this.score.left
            : null;

        if (scoreRight !== null || scoreLeft !== null) {
            this.reseting = true;
            setTimeout(() => {
                this.reset();
            }, game_config.goalResetTimeout);
        }
        
        const data: IWorldPostStep = {};
        if (playersToAdd.length) data.playersToAdd = playersToAdd;
        if (playersToRemove.length) data.playersToRemove = playersToRemove;
        if (playersMoving.length) data.playersMoving = playersMoving;
        if (ballMoving) data.ballMoving = ballMoving;
        if (scoreRight) data.scoreRight = scoreRight;
        if (scoreLeft) data.scoreLeft = scoreLeft;
        if (Object.keys(data).length) {
            this.io.emit('world::postStep', data);
        }
        
    }

    private worldStep(): void {

        // Move bodies forward in time
        this.world.step(this.step.fixedTime);
    }

}