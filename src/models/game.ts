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
import { Dictionary } from '../utils/model';
import { getNormalizedVector } from '../utils/vector';
import { ISize } from './../utils/model';

export class Game {

    private step = {
        fixedTime: 1 / 60,
        lastTime: 0,
        maxSteps: 10,
    };

    private goalSize!: ISize;

    private world!: p2.World;
    private mat: Dictionary<p2.Material> = {};
    private contactMat: Dictionary<p2.ContactMaterial> = {};

    private map!: Map;
    private player!: Player;
    private ball!: Ball;
    private leftGoal!: LeftGoal;
    private rightGoal!: RightGoal;

    private events: (() => void)[] = [];

    constructor() {
        this.initHandlers();
        this.initCanvas();
        this.initWorld();
        this.initEvents();
    }

    private initHandlers(): void {
        KeysHandler.bindEvents();
        MouseHandler.bindEvents();
    }

    private initCanvas(): void {
        Canvas.createCanvas({ width: 1700, height: 1100 });
    }

    private initWorld(): void {
        this.world = new p2.World({
            gravity: [0, 0]
        });
        this.initMaterials();

        this.goalSize = {
            height: 200,
            width: 50
        };

        this.map = new Map(this.mat.map, this.goalSize);
        this.world.addBody(this.map.topBody);
        this.world.addBody(this.map.botBody);
        this.world.addBody(this.map.borderBody);

        this.leftGoal = new LeftGoal(this.goalSize, { x:this.map.pos.x - this.goalSize.width, y: this.map.pos.y + this.map.size.height/2 - this.goalSize.height/2}, this.mat.goal);
        this.world.addBody(this.leftGoal.borderBody);
        this.world.addBody(this.leftGoal.postBody);

        this.rightGoal = new RightGoal(this.goalSize, { x: this.map.pos.x + this.map.size.width, y: this.map.pos.y + this.map.size.height/2 - this.goalSize.height/2}, this.mat.goal);
        this.world.addBody(this.rightGoal.borderBody);
        this.world.addBody(this.rightGoal.postBody);

        this.player = new Player([Canvas.size.width / 2, Canvas.size.height / 2], this.mat.player, true);
        this.world.addBody(this.player.body);

        this.ball = new Ball([Canvas.size.width / 2 - 50, Canvas.size.height / 2], this.mat.ball);
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

    private initEvents(): void {
        const isContact = (evt: any, a: p2.Body, b: p2.Body): boolean => {
               return (evt.bodyA === a || evt.bodyB === a) && (evt.bodyA === b || evt.bodyB === b);
        };
        this.world.on('beginContact', (evt: any) => {
            if (isContact(evt, this.player.body, this.ball.body)) {
                if (this.player.shooting) {
                    this.events.push(() => {
                        const shootingVector = getNormalizedVector(
                            { x: this.player.body.position[0], y: this.player.body.position[1] },
                            { x: this.ball.body.position[0], y: this.ball.body.position[1] }
                        );
                        this.ball.body.velocity[0] += shootingVector.x* 100;
                        this.ball.body.velocity[1] += shootingVector.y* 100;
                    });

                }
            }
        });
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
        this.player.logic();
        this.ball.logic();
    }

    private handleEvents(): void {
        if (this.events.length) {
            this.events.forEach(event => event());
        }
        this.events.length = 0;
    }

    public render(): void {
        Canvas.clearCanvas();
        Camera.translateStart();

        this.map.render();
        this.leftGoal.render();
        this.rightGoal.render();
        this.player.render();
        this.ball.render();

        Camera.translateEnd();

    }
}