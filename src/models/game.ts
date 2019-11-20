import * as p2 from 'p2';

import { Canvas } from './canvas';
import { KeysHandler } from './keysHandler';
import { MouseHandler } from './mouseHandler';
import { Player } from './player';
import { Map } from './map';
import { Ball } from './ball';
import { RightGoal } from './rightGoal';
import { LeftGoal } from './leftGoal';
import { Camera } from './camera';
import { goal, map, player, ball } from './callibration';
import { Dictionary } from '../utils/model';
import { getNormalizedVector, getDistance } from '../utils/vector';
import { getOffset } from './../utils/offset';

export class Game {

    private step = {
        fixedTime: 1 / 60,
        lastTime: 0,
        maxSteps: 10,
    };

    private world!: p2.World;
    private mat: Dictionary<p2.Material> = {};
    private contactMat: Dictionary<p2.ContactMaterial> = {};

    private map!: Map;
    private players: Player[] = [];
    private teamLeft: Player[] = [];
    private teamRight: Player[] = [];
    private ball!: Ball;
    private leftGoal!: LeftGoal;
    private rightGoal!: RightGoal;

    private worldEvents: (() => void)[] = [];
    private events: (() => void)[] = [];

    constructor() {
        this.initHandlers();
        this.initCanvas();
        this.initEntities();
        this.initTeams();
        this.initWorld();
        this.initCamera();
        this.initEvents();
    }

    private initHandlers(): void {
        KeysHandler.bindEvents();
        MouseHandler.bindEvents();
    }

    private initCanvas(): void {
        Canvas.createCanvas();
    }

    private initEntities(): void {
        this.map = new Map(this.mat.map);
        this.leftGoal = new LeftGoal({ x: this.map.pos.x - goal.size.width, y: this.map.pos.y + map.size.height / 2 - goal.size.height / 2 }, this.mat.goal);
        this.rightGoal = new RightGoal({ x: this.map.pos.x + map.size.width, y: this.map.pos.y + map.size.height / 2 - goal.size.height / 2 }, this.mat.goal);
        this.players.push(new Player([0, 0], this.mat.player, true));
        this.players.push(new Player([0, 0], this.mat.player));
        this.players.push(new Player([0, 0], this.mat.player));
        this.players.push(new Player([0, 0], this.mat.player));
        this.players.push(new Player([0, 0], this.mat.player));
        this.players.push(new Player([0, 0], this.mat.player));
        this.ball = new Ball([this.map.pos.x + map.size.width / 2, this.map.pos.y + map.size.height / 2], this.mat.ball);
    }

    private initTeams(): void {
        this.teamLeft.push(this.players[0], this.players[1], this.players[2]);
        this.teamLeft.forEach((player, idx) => {
            player.body.position[0] = map.size.width/6;
            player.body.position[1] = map.size.height/2 - 150*(this.teamLeft.length-1)/2 + 150*idx;
            player.color = '#8F1218';
        });
        this.teamRight.push(this.players[3], this.players[4], this.players[5]);
        this.teamRight.forEach((player, idx) => {
            player.body.position[0] = 5*map.size.width/6;
            player.body.position[1] = map.size.height/2 - 150*(this.teamLeft.length-1)/2 + 150*idx;
            player.color = '#4663A0';
        });
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
        this.players.forEach(player => {
            this.world.addBody(player.body);
        });
        this.world.addBody(this.ball.body);
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



    private initCamera(): void {
        const mainPlayer = this.players.find(player => player.main);
        if (!mainPlayer) return;
        Camera.setBounduary(getOffset(this.map.outerPos, map.outerSize));
        Camera.updatePos({ x: mainPlayer.body.position[0], y: mainPlayer.body.position[1] });
    }

    private initEvents(): void {
        const mainPlayer = this.players.find(player => player.main);
        if (mainPlayer) {
            this.events.push(() => {
                if (mainPlayer.shootingStrong || mainPlayer.shootingWeak) {
                    const playerPos = { x: mainPlayer.body.position[0], y: mainPlayer.body.position[1] };
                    const ballPos = { x: this.ball.body.position[0], y: this.ball.body.position[1] };
                    const minDistance = player.radius + ball.radius;
                    const shootingDistance = 3;
                    if (getDistance(playerPos, ballPos) - minDistance < shootingDistance) {
                        const shootingVector = getNormalizedVector(
                            { x: mainPlayer.body.position[0], y: mainPlayer.body.position[1] },
                            { x: this.ball.body.position[0], y: this.ball.body.position[1] }
                        );
                        if (mainPlayer.shootingStrong && mainPlayer.shootingWeak) {
                            this.ball.body.velocity[0] += shootingVector.x * (player.shootingStrong + player.shootingWeak) / 2;
                            this.ball.body.velocity[1] += shootingVector.y * (player.shootingStrong + player.shootingWeak) / 2;
                        } else if (mainPlayer.shootingStrong) {
                            this.ball.body.velocity[0] += shootingVector.x * player.shootingStrong;
                            this.ball.body.velocity[1] += shootingVector.y * player.shootingStrong;
                        } else if (mainPlayer.shootingWeak) {
                            this.ball.body.velocity[0] += shootingVector.x * player.shootingWeak;
                            this.ball.body.velocity[1] += shootingVector.y * player.shootingWeak;
                        }
                    };

                }
            });
        }
    }

    public run(time: number) {
        this.worldStep(time);
        this.logic();
        this.handleEvents();
        this.render();
    }

    private worldStep(time: number): void {
        // Compute elapsed time since last render frame
        const deltaTime = time - this.step.lastTime / 1000;

        // Move bodies forward in time
        this.world.step(this.step.fixedTime, deltaTime, this.step.maxSteps);

        this.step.lastTime = time;
    }

    private logic(): void {
        KeysHandler.reactOnKeys();
        MouseHandler.reactOnClicks();

        this.map.logic();
        this.leftGoal.logic();
        this.rightGoal.logic();
        this.players.forEach(player => {
            player.logic();
        });
        this.ball.logic();
    }

    private handleEvents(): void {
        if (this.worldEvents.length) {
            this.worldEvents.forEach(event => event());
        }
        this.worldEvents.length = 0;

        if (this.events.length) {
            this.events.forEach(event => event());
        }
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