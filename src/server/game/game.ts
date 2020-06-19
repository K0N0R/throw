import p2 from 'p2';
import io from 'socket.io';

import { Player } from './player';
import { Map } from './map';
import { Ball } from './ball';
import { RightGoal } from './rightGoal';
import { LeftGoal } from './leftGoal';
import { goal_config, map_config, player_config, ball_config, game_config } from './../../shared/callibration';
import { Dictionary } from './../../shared/model';
import { getNormalizedVector, getDistance } from './../../shared/vector';
import { isMoving } from '../../shared/body';
import { Team } from './../../shared/team';
import { IPlayerKey, IWorldReset, IWorldPostStep } from './../../shared/events';
import { User } from './../lobby/user';

export class Game {
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
    private reseting!: boolean;

    private initStage: boolean;
    constructor(private io: io.Server, private users: User[], timeLimit, scoreLimit, public roomId: string) {
        this.initStage = true;
        this.step = {
            fixedTime: 1 / 240,
            lastTime: new Date().valueOf(),
            maxSteps: 10,
        };
        this.initEntities();
        this.initWorld();
        this.initPlayers();
    }

    //#region player
    private initPlayers(): void {
        this.users.filter(item => item.team !== Team.Spectator).forEach((item) => {
             this.addNewPlayer(item);
        });
    }

    public addNewPlayer(user: User): void {
        const player = new Player(user.socket.id, user.nick, user.avatar, user.team, this.mat.player);
        this.playersToAdd.push(player);
    }

    private addPlayerToWorld(player: Player): void {
        this.playersToAdd.push(player);
        this.world.addBody(player.body);
        this.bindPlayerEvents(player);
    }


    private bindPlayerEvents(player: Player): void {
        const user = this.users.find(item => item.socket.id === player.socketId);
        if (!user) return;
        user.socket.on('disconnect', () => {
            this.playersToRemove.push(player);
        });

        user.socket.on('player::key', (data: IPlayerKey) => {
            for (let key in data) {
                player.keyMap[key] = data[key];
            }
        });
    }

    public removePlayer(user: User): void {
        const player = this.players.find(item => item.socketId === user.socket.id);
        if (player) {
            this.playersToRemove.push(player);
        }
        user.socket.removeAllListeners('player::key');
        user.socket.removeAllListeners('disconnect');
    }
    //#endregion 

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
        //this.world.addBody(this.map.leftHalfBody); LEFT TEAM START GAME
        this.world.addBody(this.map.rightHalfBody);

        this.world.addBody(this.leftGoal.borderBody);
        this.world.addBody(this.leftGoal.postBody);

        this.world.addBody(this.rightGoal.borderBody);
        this.world.addBody(this.rightGoal.postBody);
        this.world.addBody(this.ball.body);

        this.world.addContactMaterial(this.contactMat.mapBall);
        this.world.addContactMaterial(this.contactMat.playerBall);
        this.world.addContactMaterial(this.contactMat.goalBall);
        this.world.addContactMaterial(this.contactMat.mapPlayer);

        this.world.on('postStep', () => {
            this.logic();
        });
    }

    private initMaterials(): void {
        this.mat.map = new p2.Material();
        this.mat.player = new p2.Material();
        this.mat.ball = new p2.Material();
        this.mat.goal = new p2.Material();
        this.contactMat.mapPlayer = new p2.ContactMaterial(this.mat.map, this.mat.player, {
            friction: 0
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
            friction: 0
        });
    }

    private reset(teamWhoScored?: Team): void {
        // ball reset
        this.ball.body.position[0] = this.map.pos.x + map_config.size.width / 2;
        this.ball.body.position[1] = this.map.pos.y + map_config.size.height / 2;
        this.ball.body.force = [0, 0];
        this.ball.body.velocity = [0, 0];

        // players reset
        const leftTeam = this.players.filter(player => player.team === Team.Left);
        const leftTeamX = this.map.pos.x + goal_config.size.width + player_config.radius;
        const leftTeamY = this.map.pos.y + map_config.size.height / 2 - ((leftTeam.length - 1) * (player_config.radius * 2 + 10)) / 2
        leftTeam.forEach((player, idx) => {
            player.body.position[0] = leftTeamX;
            player.body.position[1] = leftTeamY + (player_config.radius * 2 + 10) * idx;
            player.body.force = [0, 0];
        });
        const rightTeam = this.players.filter(player => player.team === Team.Right);
        const rightTeamX = this.map.pos.x + map_config.size.width - goal_config.size.width - player_config.radius;
        const rightTeamY = this.map.pos.y + map_config.size.height / 2 - ((rightTeam.length - 1) * (player_config.radius * 2 + 10)) / 2
        rightTeam.forEach((player, idx) => {
            player.body.position[0] = rightTeamX;
            player.body.position[1] = rightTeamY + (player_config.radius * 2 + 10) * idx;
            player.body.force = [0, 0];
            player.body.velocity = [0, 0];
        });

        // map reset
        if (teamWhoScored === Team.Left) {
             this.world.addBody(this.map.leftHalfBody);
        } else {
            this.world.addBody(this.map.rightHalfBody);
        }

        // event
        this.io.to(this.roomId).emit('world::reset', ({
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

    public logic(): void {
        const playersShootingMap = this.players.map(player => ({ socketId: player.socketId, shooting: player.shooting }));
        this.players.forEach(player => {
            player.logic();
        });

        const playersShooting = this.players
            .filter(player => player.shooting !== playersShootingMap.find(plr => plr.socketId === player.socketId)?.shooting)
            .map(player => ({ socketId: player.socketId, shooting: player.shooting }))

        this.players
            .filter((player) => player.shooting && !player.shootingCooldown)
            .forEach(player => {
                const playerPos = { x: player.body.position[0], y: player.body.position[1] };
                const ballPos = { x: this.ball.body.position[0], y: this.ball.body.position[1] };
                const minDistance = player_config.radius + ball_config.radius;
                const shootingDistance = 5;
                if (getDistance(playerPos, ballPos) - minDistance < shootingDistance) {
                    player.shoot();
                    const shootingVector = getNormalizedVector(
                        { x: player.body.position[0], y: player.body.position[1] },
                        { x: this.ball.body.position[0], y: this.ball.body.position[1] }
                    );
                    this.ball.body.force[0] += (player.body.velocity[0]*0.5) + (shootingVector.x * player_config.shooting);
                    this.ball.body.force[1] += (player.body.velocity[1]*0.5) + (shootingVector.y * player_config.shooting);
                }
            });


        const playersToAdd = this.playersToAdd.map(player => {
            this.addPlayerToWorld(player);
            this.players.push(player);

            this.world.addBody(player.body);
            return {
                name: player.name,
                avatar: player.avatar,
                socketId: player.socketId,
                team: player.team,
                position: player.body.position,
            };
        });
        this.playersToAdd.length = 0;

        const playersToRemove = this.playersToRemove.map(player => {
            this.world.removeBody(player.body);
            const playerIdx = this.players.indexOf(player);
            this.players.splice(playerIdx, 1);
            return player.socketId;
        })
        this.playersToRemove.length = 0;

        const playersMoving = this.players
            .filter(player => isMoving(player.body))
            .map(player => ({ socketId: player.socketId, position: player.body.interpolatedPosition }));

        const ballMoving = isMoving(this.ball.body)
            ? { position: this.ball.body.interpolatedPosition }
            : null;

        if (ballMoving) {
            const rightIdx = this.world.bodies.indexOf(this.map.rightHalfBody)
            if (rightIdx != -1) {
                this.world.removeBody(this.map.rightHalfBody);
            }
            const leftIdx = this.world.bodies.indexOf(this.map.leftHalfBody)
            if (leftIdx != -1) {
                this.world.removeBody(this.map.leftHalfBody);
            }
        }

        const scoreRight = !this.reseting && this.ball.body.position[0] < this.map.pos.x
            ? ++this.score.right
            : null;

        const scoreLeft = !this.reseting && this.ball.body.position[0] > this.map.pos.x + map_config.size.width
            ? ++this.score.left
            : null;

        if (scoreRight !== null || scoreLeft !== null) {
            const teamWhoScored = scoreRight ? Team.Right : Team.Left;
            this.reseting = true;
            setTimeout(() => {
                this.reset(teamWhoScored);
            }, game_config.goalResetTimeout);
        }

        if (this.initStage) {
            this.reset();
            this.initStage = false;
        }
        
        const data: IWorldPostStep = {};
        if (playersToAdd.length) data.playersToAdd = playersToAdd;
        if (playersToRemove.length) data.playersToRemove = playersToRemove;
        if (playersMoving.length) data.playersMoving = playersMoving;
        if (playersShooting.length) data.playersShooting = playersShooting;
        if (ballMoving) data.ballMoving = ballMoving;
        if (scoreRight) data.scoreRight = scoreRight;
        if (scoreLeft) data.scoreLeft = scoreLeft;
        if (Object.keys(data).length) {
            this.io.to(this.roomId).emit('world::postStep', data);
        }

    }

    public run() {
        // Move bodies forward in time
        const time = new Date().valueOf();
        const timeSinceLastCall = time - this.step.lastTime;
        this.step.lastTime = time;
        this.world.step(this.step.fixedTime, timeSinceLastCall/1000, this.step.maxSteps);
    }

}
