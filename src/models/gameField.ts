import * as p2 from 'p2';

import { Canvas } from './canvas';
import { KeysHandler } from './keysHandler';
import { MouseHandler } from './mouseHandler';
import { Player } from './player';
import { Camera } from './../../dist/src/models/camera';
import { EventManager } from './eventManager';
import { Dictionary } from './../utils/model';
import { Map } from './map';
import { Ball } from './ball';
import { getNormalizedVector } from './../utils/vector';


export class GameField {

    private static step = {
        fixedTime: 1 / 60,
        lastTime: 0,
        max: 10,
    };
    private static world: p2.World;
    private static material: Dictionary<p2.Material> = {};
    private static contactMaterial: Dictionary<p2.ContactMaterial> = {};

    private static map: Map;
    private static player: Player;
    private static ball: Ball;

    private static events: (() => void)[] = [];

    public static init() {
        this.initHandlers();
        this.initCanvas();
        this.initWorld();
        this.initEventManager();
    }

    private static initHandlers(): void {
        KeysHandler.bindEvents();
        MouseHandler.bindEvents();
    }

    private static initCanvas(): void {
        Canvas.createCanvas({ width: 1500, height: 900 });
    }

    private static initWorld(): void {
        this.world = new p2.World({
            gravity: [0, 0]
        });
        this.initMaterials();
        this.map = new Map(this.material.map);
        this.world.addBody(this.map.topBody);
        this.world.addBody(this.map.botBody);
        this.world.addBody(this.map.leftGoal.body);
        this.world.addBody(this.map.rightGoal.body);

        this.player = new Player([Canvas.size.width / 2, Canvas.size.height / 2], this.material.player);
        this.world.addBody(this.player.body);

        this.ball = new Ball([Canvas.size.width / 2 - 50, Canvas.size.height / 2], this.material.ball);
        this.world.addBody(this.ball.body);
    }

    private static initMaterials(): void {
        this.material.map = new p2.Material();
        this.material.player = new p2.Material();
        this.material.ball = new p2.Material();
        this.contactMaterial.mapPlayer = new p2.ContactMaterial(this.material.map, this.material.player, {
            friction: 1
        });
        this.contactMaterial.mapBall = new p2.ContactMaterial(this.material.map, this.material.ball, {
            friction: 0
        });
        this.contactMaterial.playerBall = new p2.ContactMaterial(this.material.player, this.material.ball, {
            friction: 1
        });
        this.world.addContactMaterial(this.contactMaterial.mapBall);
        this.world.addContactMaterial(this.contactMaterial.playerBall);
        this.world.addContactMaterial(this.contactMaterial.mapPlayer);
    }

    private static initEventManager(): void {
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

        // this.world.on('postStep', function(event: any){
        //     // Add horizontal spring force
        //     if(event.target.endContactEvent.shapeA)
        //     {
        //         console.log(event.target.endContactEvent.shapeA);
        //     }

        //     if(event.target)
        //     {
        //         console.log(event.target);
        //     }
        // });
    }

    public static run(time: number) {
        //Camera.translateStart();
        this.worldStep(time);
        this.logic()
        this.render();

        //Camera.translateEnd();
    }

    private static worldStep(time: number): void {
        // Compute elapsed time since last render frame
        const deltaTime = time - this.step.lastTime / 1000;

        // Move bodies forward in time
        this.world.step(this.step.fixedTime, deltaTime, this.step.max);

        this.step.lastTime = time;
    }

    private static logic(): void {
        KeysHandler.reactOnKeys();
        MouseHandler.reactOnClicks();
        if (this.events.length) {
            this.events.forEach(event=> event());
        }
        this.events.length = 0;
    }

    public static render(): void {
        Canvas.clearCanvas();

        this.map.render();
        this.player.render();
        this.ball.render();
    }
}