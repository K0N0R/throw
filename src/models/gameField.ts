import * as p2 from 'p2';

import { Canvas } from './canvas';
import { KeysHandler } from './keysHandler';
import { MouseHandler } from './mouseHandler';
import { Player } from './player';
import { Camera } from './../../dist/src/models/camera';
import { EventManager } from './eventManager';
import { Dictionary } from './../utils/model';
import { Map } from './map';


export class GameField {

    private static step = {
        fixedTime: 1/60,
        lastTime: 0,
        max: 10,
    };
    private static world: p2.World;
    private static material: Dictionary<p2.Material> = {};
    private static contactMaterial: Dictionary<p2.ContactMaterial> = {};

    private static map: Map;
    private static player: Player;

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
            gravity:[0, 0]
        });
        this.initMaterials();
        this.map = new Map(this.material.map);
        this.player = new Player([Canvas.size.width/2, Canvas.size.height/2], this.material.player);
        this.world.addBody(this.player.body);
        this.world.addBody(this.map.body);
    }

    private static initMaterials(): void {
        this.material.map = new p2.Material();
        this.material.player = new p2.Material();
        this.contactMaterial.mapPlayerMat = new p2.ContactMaterial(this.material.map, this.material.player, {
            friction: 1
        });
        this.world.addContactMaterial(this.contactMaterial.mapPlayerMat);
    }

    private static initEventManager(): void {
        this.world.on('beginContact', function (evt: any) {
            console.log(evt);
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
        // EventManager.add({
        //     event: 'player::move',
        //     handler: (player: Player) => {
        //         Camera.updatePos(player.body.position);
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
    }

    public static render(): void {
        Canvas.clearCanvas();

        this.player.render();
        this.map.render();
    }
}