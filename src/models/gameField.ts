import { IPos } from './../utils/model';
import { Canvas } from './canvas';
import { Collision } from './collision';
import { GameMap, CollisionInfo } from './gameMap';
import { Player } from './player';
import { Bullet } from './bullet';
import { KeysHandler } from './keysHandler'; 
import { MouseHandler } from './mouseHandler';

export class GameField {
    public static players: Player[] = [];
    public static bullets: Bullet[] = [];
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

    private static addPlayer(pos?: IPos): void {
        const generatePlayerPos = () => {
            return { x: 100, y: 100};
        };
        pos = pos || generatePlayerPos();
        const newPlayer = new Player(pos);
        this.players.push(newPlayer);
        const disposeMoveHandler = newPlayer.observe('move', (player: Player, oldPosition: IPos) => {
            Collision.stopOnCollision(player, oldPosition);
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
        Canvas.clearCanvas();
        GameMap.render();
        this.players.forEach(p => {
            p.render();
        });
        this.bullets.forEach(b => {
            b.render();
            console.log('bullet render')
        });
    }
}