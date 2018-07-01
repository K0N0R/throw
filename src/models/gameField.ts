import { IPos } from './../utils/model';
import { Canvas } from './canvas';
import { Collision } from './collision';
import { GameMap, CollisionInfo } from './gameMap';
import { Player } from './player';
import { KeysHandler } from './keysHandler'; 
import { MouseHandler } from './mouseHandler';

export class GameField {
    public static players: Player[] = [];
    public static init() {

        Canvas.createCanvas();
        Canvas.width = 1200;
        Canvas.height = 800;

        GameMap.createMap();
        GameMap.bricks.forEach(b => {
            Collision.addStatic(b);
        });
        KeysHandler.bindEvents();
        MouseHandler.bindEvents();
        GameMap.bricks.forEach(b => {
            Collision.addStatic(b);
        });
        this.addPlayer();
    }

    public static run() {
        this.logic();
        this.render();
    }

    private static addPlayer(pos?: IPos) {
        const generatePlayerPos = () => {
            return { x: 100, y: 100};
        };
        pos = pos || generatePlayerPos();
        const newPlayer = new Player(pos);
        this.players.push(newPlayer);
        newPlayer.onPositionChanged((player: Player, oldPosition: IPos) => {
            Collision.checkCollision(player, oldPosition);
        });
    }

    private static logic(): void {
        KeysHandler.reactOnKeys();
        MouseHandler.reactOnCLicks();
        this.players.forEach(p => {
            p.logic();
        });

    }

    public static render(): void {
        Canvas.clearCanvas();
        GameMap.render();
        this.players.forEach(p => {
            p.render();
        });
    }
}