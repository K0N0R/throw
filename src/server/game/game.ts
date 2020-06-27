import p2 from 'p2';
import io from 'socket.io';

import { Player } from './player';
import { Map } from './map';
import { Ball } from './ball';
import { RightGoal } from './rightGoal';
import { LeftGoal } from './leftGoal';
import { map_config, game_config, MapKind } from './../../shared/callibration';
import { Dictionary } from './../../shared/model';
import { getNormalizedVector, getDistance } from './../../shared/vector';
import { isMoving } from '../../shared/body';
import { Team } from './../../shared/team';
import { IWorldReset, IWorldPostStep, IRoomGameData } from './../../shared/events';
import { User } from './../lobby/user';
import { KeysMap } from './../../shared/keysHandler';

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

    private reseting!: boolean;
    private hardResesting!: boolean;

    private initStage: boolean;
    constructor(private io: io.Server, private mapKind: MapKind, users: User[], public roomId: string,
        private onGameTimeStop: () => void,
        private onGameTimeResume: () => void,
        private onGameScoreChanged: (team: Team) => void) {
        this.initStage = true;
        this.step = {
            fixedTime: 1 / 240,
            lastTime: new Date().valueOf(),
            maxSteps: 10,
        };
        this.initEntities();
        this.initWorld();
        this.initPlayers(users);
    }

    public dispose(): void {
        this.world.off('postStep', this.logic.bind(this));
        this.players.forEach((item) => this.removePlayer(item.user));
    }

    public endGame(): void {
        this.reseting = true;
        this.hardResesting = true;
    }

    public getGameData(): IRoomGameData {
        return {
            players: this.players.map(item => ({
                nick: item.nick,
                avatar: item.avatar,
                socketId: item.user.socket.id,
                team: item.team,
                position: item.body.position
            })),
            ball: {
                position: this.ball.body.position
            }
        };
    }

    //#region player
    private initPlayers(users): void {
        users.filter(item => item.team !== Team.Spectator).forEach((item) => {
             this.addNewPlayer(item);
        });
    }

    public updatePlayers(users: User[]): void {
        this.players.forEach(player => {
            const user = users.find((user) => player.user === user);
            if (!user || user.team === Team.Spectator) {
                this.removePlayer(player.user);
            }
        });

        users.forEach(user => {
            const player = this.players.find(player => player.user.socket.id === user.socket.id);
            if (!player && user.team !== Team.Spectator) {
                this.addNewPlayer(user);
            } else if (player && player.team !== user.team) {
                this.removePlayer(user);
                if (user.team !== Team.Spectator) {
                    this.addNewPlayer(user);
                }
            }
        })
    }

    public addNewPlayer(user: User): void {
        const leftTeam = this.players.filter(item=> item.team === Team.Left);
        const rightTeam = this.players.filter(item=> item.team === Team.Right);
        const initPos = {
            x: user.team === Team.Left
                ? map_config[this.mapKind].player.radius
                : map_config[this.mapKind].outerSize.width - map_config[this.mapKind].player.radius,
            y : user.team === Team.Left
                ? map_config[this.mapKind].outerSize.height / 2 - map_config[this.mapKind].goal.size.height/2 + ((map_config[this.mapKind].player.radius * 2 + 10) * (leftTeam.length - 1))
                : map_config[this.mapKind].outerSize.height / 2 - map_config[this.mapKind].goal.size.height/2 + ((map_config[this.mapKind].player.radius * 2 + 10) * (rightTeam.length - 1))
        };
        const player = new Player(this.mapKind, user, user.nick, user.avatar, user.team, this.mat.player, initPos);
        this.playersToAdd.push(player);
    }

    private addPlayerToWorld(player: Player): void {
        this.playersToAdd.push(player);
        this.world.addBody(player.body);
        this.bindPlayerEvents(player);
    }

    private bindPlayerEvents(player: Player): void {
        player.user.onDisconnect('player::disconnect', () => {
            this.playersToRemove.push(player);
        });

        player.user.socket.on('game::player-key', (data: KeysMap) => {
            for (let key in data) {
                player.keysMap[key] = data[key];
            }
        });
    }

    public removePlayer(user: User): void {
        const player = this.players.find(item => item.user.socket.id === user.socket.id);
        if (player) {
            this.playersToRemove.push(player);
        }
        user.offDisconnect('player::disconnect');
        user.socket.removeAllListeners('game::player-key');
    }
    //#endregion 

    private initEntities(): void {
        this.initMaterials();
        this.map = new Map(this.mapKind, this.mat.map);
        this.leftGoal = new LeftGoal(this.mapKind, this.mat.goal, this.mat.map);
        this.rightGoal = new RightGoal(this.mapKind, this.mat.goal, this.mat.map);
        this.ball = new Ball(this.mapKind, this.mat.ball);
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

        this.world.on('postStep', this.logic.bind(this));
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
        this.ball.body.position[0] = map_config[this.mapKind].outerSize.width / 2;
        this.ball.body.position[1] = map_config[this.mapKind].outerSize.height / 2;
        this.ball.body.force = [0, 0];
        this.ball.body.velocity = [0, 0];

        // players reset
        const leftTeam = this.players.filter(player => player.team === Team.Left);
        const leftTeamX = this.map.pos.x + map_config[this.mapKind].goal.size.width + map_config[this.mapKind].player.radius;
        const leftTeamY = this.map.pos.y + map_config[this.mapKind].size.height / 2 - ((leftTeam.length - 1) * (map_config[this.mapKind].player.radius * 2 + 10)) / 2
        leftTeam.forEach((player, idx) => {
            player.body.position[0] = leftTeamX;
            player.body.position[1] = leftTeamY + (map_config[this.mapKind].player.radius * 2 + 10) * idx;
            player.body.force = [0, 0];
        });
        const rightTeam = this.players.filter(player => player.team === Team.Right);
        const rightTeamX = this.map.pos.x + map_config[this.mapKind].size.width - map_config[this.mapKind].goal.size.width - map_config[this.mapKind].player.radius;
        const rightTeamY = this.map.pos.y + map_config[this.mapKind].size.height / 2 - ((rightTeam.length - 1) * (map_config[this.mapKind].player.radius * 2 + 10)) / 2
        rightTeam.forEach((player, idx) => {
            player.body.position[0] = rightTeamX;
            player.body.position[1] = rightTeamY + (map_config[this.mapKind].player.radius * 2 + 10) * idx;
            player.body.force = [0, 0];
            player.body.velocity = [0, 0];
        });

        // map reset
        if (teamWhoScored != null) {
            if (teamWhoScored === Team.Left) {
                this.world.addBody(this.map.leftHalfBody);
            } else if (teamWhoScored === Team.Right) {
                this.world.addBody(this.map.rightHalfBody);
            }
        }

        // event
        this.io.to(this.roomId).emit('game::reset', ({
            players: this.players.map(player => ({
                socketId: player.user.socket.id,
                position: player.body.position,
            })),
            ball: {
                position: this.ball.body.position,
            },
        }) as IWorldReset);
        this.reseting = false;
    }

    public logic(): void {
        const playersShootingMap = this.players.map(player => ({ socketId: player.user.socket.id, shooting: player.shooting }));
        this.players.forEach(player => {
            player.logic();
        });

        const playersShooting = this.players
            .filter(player => player.shooting !== playersShootingMap.find(plr => plr.socketId === player.user.socket.id)?.shooting)
            .map(player => ({ socketId: player.user.socket.id, shooting: player.shooting }))

        this.players
            .filter((player) => player.shooting && !player.shootingCooldown)
            .forEach(player => {
                const playerPos = { x: player.body.position[0], y: player.body.position[1] };
                const ballPos = { x: this.ball.body.position[0], y: this.ball.body.position[1] };
                const minDistance = map_config[this.mapKind].player.radius + map_config[this.mapKind].ball.radius;
                const shootingDistance = 5;
                if (getDistance(playerPos, ballPos) - minDistance < shootingDistance) {
                    player.shoot();
                    const shootingVector = getNormalizedVector(
                        { x: player.body.position[0], y: player.body.position[1] },
                        { x: this.ball.body.position[0], y: this.ball.body.position[1] }
                    );
                    this.ball.body.force[0] += (player.body.velocity[0]*0.5) + (shootingVector.x * game_config.player.shooting);
                    this.ball.body.force[1] += (player.body.velocity[1]*0.5) + (shootingVector.y * game_config.player.shooting);
                }
            });


        const playersToAdd = this.playersToAdd.map(player => {
            this.addPlayerToWorld(player);
            this.players.push(player);

            this.world.addBody(player.body);
            return {
                nick: player.nick,
                avatar: player.avatar,
                socketId: player.user.socket.id,
                team: player.team,
                position: player.body.position,
            };
        });
        this.playersToAdd.length = 0;

        const playersToRemove = this.playersToRemove.map(player => {
            this.world.removeBody(player.body);
            const playerIdx = this.players.indexOf(player);
            this.players.splice(playerIdx, 1);
            return player.user.socket.id;
        })
        this.playersToRemove.length = 0;

        const playersMoving = this.players
            .filter(player => isMoving(player.body))
            .map(player => ({ socketId: player.user.socket.id, position: player.body.interpolatedPosition }));

        const ballMoving = isMoving(this.ball.body)
            ? { position: this.ball.body.interpolatedPosition }
            : null;

        if (ballMoving) {
            const rightIdx = this.world.bodies.indexOf(this.map.rightHalfBody)
            if (rightIdx != -1) {
                this.world.removeBody(this.map.rightHalfBody);
                this.onGameTimeResume();
            }
            const leftIdx = this.world.bodies.indexOf(this.map.leftHalfBody)
            if (leftIdx != -1) {
                this.world.removeBody(this.map.leftHalfBody);
                this.onGameTimeResume();
            }
        }

        const scoreRight = !this.reseting && this.ball.body.position[0] < this.map.pos.x - map_config[this.mapKind].ball.radius;


        const scoreLeft = !this.reseting && this.ball.body.position[0] > this.map.pos.x + map_config[this.mapKind].size.width + map_config[this.mapKind].ball.radius;

        const scoreChanged = scoreRight || scoreLeft;
        const teamWhoScored = scoreChanged
            ? (scoreRight ? Team.Right : Team.Left)
            : void 0;

        if (scoreChanged) {
            this.onGameScoreChanged(teamWhoScored as Team);
            this.onGameTimeStop();
            this.reseting = true;
            setTimeout(() => {
                if (this.hardResesting) return;
                this.reset(teamWhoScored);
            }, game_config.goalResetTimeout);
        }

        if (this.initStage) {
            this.onGameTimeStop();
            this.reset();
            this.initStage = false;
        }
        
        const data: IWorldPostStep = {};
        if (playersToAdd.length != null) data.playersToAdd = playersToAdd;
        if (playersToRemove.length != null) data.playersToRemove = playersToRemove;
        if (playersMoving.length != null) data.playersMoving = playersMoving;
        if (playersShooting.length != null) data.playersShooting = playersShooting;
        if (ballMoving != null) data.ballMoving = ballMoving;
        if (Object.keys(data).length) {
            this.io.to(this.roomId).emit('game::step', data);
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
