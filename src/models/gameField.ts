import { Canvas } from './canvas';
import { GameMap, CollisionInfo } from './gameMap';
import { Player } from './player';
import { KeysHandler } from './keysHandler'; 
export interface GameFieldConfig {
    assets: any;
}

export class GameField {
    private static initialized: boolean;
    public static players: Player[] = [];
    public static init(config: GameFieldConfig) {
        Canvas.createCanvas();
        Canvas.width = 1200;
        Canvas.height = 800;
        GameMap.createMap();
        KeysHandler.bindEvents();
        this.players.push(new Player);
        // init players
        // init 
        this.initialized = true;
    }

    private static logic(): void {
        KeysHandler.reactOnKeys();
        this.players.forEach(p => {
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