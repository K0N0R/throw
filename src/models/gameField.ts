import { IPos } from './../utils/model';
import { Canvas } from './canvas';
import { Collision } from './collision';
import { GameMap, CollisionInfo } from './gameMap';
import { Player } from './player';
import { Bullet } from './bullet';
import { KeysHandler } from './keysHandler'; 
import { MouseHandler } from './mouseHandler';
import { Camera } from './camera';

export class GameField {
    private static players: Player[] = [];
    private static bullets: Bullet[] = [];
    public static init() {
        KeysHandler.bindEvents();
        MouseHandler.bindEvents();

        Canvas.createCanvas();
        Canvas.width = 1200;
        Canvas.height = 800;
        
        GameMap.createMap();
        GameMap.bricks.forEach(b => {
            Collision.addStatic(b);
        });
        // GameMap.bricks.forEach(b => { //FIXME: 
        //     Collision.addStatic(b);
        // }); 
        this.addPlayer(true);
    }

    public static run() {
        Canvas.clearCanvas();
        Camera.translateStart();
        this.logic();
        this.render();
        Camera.translateEnd();
    }

    private static addPlayer(main: boolean): void {
        const generatePlayerPos = () => {
            return { x: 100, y: 100};
        };
        const newPlayer = new Player(generatePlayerPos(), main);
        this.players.push(newPlayer);
        if (main) Camera.pos = newPlayer.pos;

        const disposeMoveHandler = newPlayer.observe('move', (player: Player, oldPosition: IPos) => {
            Collision.stopOnCollision(player, oldPosition);
            if (player.main) Camera.pos = player.pos;
        });
        const disposeShootHandler = newPlayer.observe('shoot', this.addBullet.bind(this));
    }

    private static addBullet(player: Player): void {
        const bulletPos = { x: player.pos.x + player.rotationVector.x * player.shift, y: player.pos.y + player.rotationVector.y * player.shift };
        const newBullet = new Bullet(bulletPos, { x: player.rotationVector.x * 10, y: player.rotationVector.y * 10 });
        this.bullets.push(newBullet);
        newBullet.observe('move', (bullet: Bullet) => {
            if (Collision.checkCollision(bullet)) {
                const idx = this.bullets.indexOf(newBullet);
                if (idx !== -1) {
                    this.bullets.splice(idx, 1);
                }
            }
        });
    }

    private static logic(): void {
        KeysHandler.reactOnKeys();
        MouseHandler.reactOnClicks();
 
        this.players.forEach(p => {
            p.logic();
        });
        
        this.bullets.forEach(b => {
            b.logic();
        });      
    }

    public static render(): void {
        GameMap.render();
        this.players.forEach(p => {
            p.render();
        });
        this.bullets.forEach(b => {
            b.render();
        });
    }
}