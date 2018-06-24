import { Canvas } from './canvas';
import { GameMap } from './gameMap';
import { Player } from './player';
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
        this.players.push(new Player);
        // init players
        // init 
        this.initialized = true;
    }


    public static render() {
        if (this.initialized) {
            Canvas.clearCanvas();
            GameMap.render();
            this.players.forEach(p => {
                p.render();
            });
        }
    }
}