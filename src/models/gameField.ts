import { Canvas } from './canvas';
import { GameMap, CollisionInfo } from './gameMap';
import { Player } from './player';
import { KeysHandler } from './keysHandler'; 
import { MouseHandler } from './mouseHandler';

export class GameField {
    private static initialized: boolean;
    public static players: Player[] = [];
    public static init() {
        Canvas.createCanvas();
        Canvas.width = 1200;
        Canvas.height = 800;
        GameMap.createMap();
        KeysHandler.bindEvents();
        MouseHandler.bindEvents();
        this.players.push(new Player());
        // init players
        // init 
        this.initialized = true;
    }

    private static logic(): void {
        KeysHandler.reactOnKeys();
        this.players.forEach(p => {
            p.logic();
            const collisionInfo = GameMap.checkCollision(p.pos, p.radius);
            if (collisionInfo && collisionInfo.changed) {
                p.pos = collisionInfo.pos;
            }
        });
    }

    public static render() {
        if (this.initialized) {
            this.logic();
            Canvas.clearCanvas();
            GameMap.render();
            this.players.forEach(p => {
                p.render();
            });
        }
    }
}