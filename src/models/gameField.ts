import { Canvas } from './canvas';
import { Collision } from './collision';
import { GameMap, IMapScale } from './gameMap';
import { Player } from './player';
import { Bullet } from './bullet';
import { KeysHandler } from './keysHandler';
import { MouseHandler } from './mouseHandler';
import { Camera } from './camera';
import { EventManager } from './eventManager';
import { ObjectBase } from './objectBase';

export class GameField {
    private static players: Player[] = [];
    private static bullets: Bullet[] = [];
    public static init() {
        KeysHandler.bindEvents();
        MouseHandler.bindEvents();

        Canvas.createCanvas();
        Canvas.width = 1200;
        Canvas.height = 800;

        GameMap.createMap(IMapScale.Small);

        const newPlayer = new Player({ x: 600, y: 400 });
        this.players.push(newPlayer);
        Camera.updatePos(newPlayer.pos);

        this.bindEvents();
    }

    private static bindEvents(): void {
        EventManager.add({
            event: 'camera::move',
            handler: () => {
                MouseHandler.updateMousePos();
            }
        });

        EventManager.add({
            event: 'player::move',
            handler: (player: Player) => {
                const predictObject = new ObjectBase({
                    x: player.pos.x + player.moveVector.x,
                    y: player.pos.y + player.moveVector.y
                }, player.shape, player.size);

                const collisionSides = Collision.checkMapCollision(predictObject);
                if (collisionSides.top || collisionSides.bottom) {
                    player.moveVector.y = 0;
                }

                if (collisionSides.left || collisionSides.right) {
                    player.moveVector.x = 0;
                }

                // const predictXObject = new ObjectBase({
                //     x: player.pos.x + player.moveVector.x,
                //     y: player.pos.y
                // }, player.shape, player.size);

                // const xCollisionSides = Collision.checkCollisionForSegments(predictXObject);
                // if (xCollisionSides.left || xCollisionSides.right) {
                //     player.moveVector.x = 0;
                // }

                // const predictYObject = new ObjectBase({
                //     x: player.pos.x,
                //     y: player.pos.y  + player.moveVector.y
                // }, player.shape, player.size);

                // const yCollisionSides = Collision.checkCollisionForSegments(predictYObject);
                // if (yCollisionSides.top || yCollisionSides.bottom) {
                //     player.moveVector.y = 0;
                // }


                Camera.updatePos(player.pos);
            }
        });

        EventManager.add({
            event: 'player::shoot',
            handler: (player: Player) => {
                const bulletPos = { x: player.pos.x + player.rotationVector.x * player.radius, y: player.pos.y + player.rotationVector.y * player.radius };
                const newBullet = new Bullet(bulletPos, { x: player.rotationVector.x * 10, y: player.rotationVector.y * 10 });
                this.bullets.push(newBullet);
            }
        });

        EventManager.add({
            event: 'bullet::move',
            handler: (bullet: Bullet) => {
                const predictObject = new ObjectBase({
                    x: bullet.pos.x + bullet.moveVector.x,
                    y: bullet.pos.y + bullet.moveVector.y
                }, bullet.shape, bullet.size);
                // if (Collision.checkCollision(predictObject)) {
                //     const idx = this.bullets.indexOf(bullet);
                //     if (idx !== -1) {
                //         this.bullets.splice(idx, 1);
                //     }
                // }
            }
        });
    }

    public static run() {
        Canvas.clearCanvas();
        Camera.translateStart();
        this.logic();
        this.render();
        Camera.translateEnd();
    }

    private static logic(): void {
        KeysHandler.reactOnKeys();
        MouseHandler.reactOnClicks();

        this.players.forEach(p => p.logic());
        this.bullets.forEach(b => b.logic());
    }

    public static render(): void {
        GameMap.render();
        this.players.forEach(p => p.render());
        this.bullets.forEach(b => b.render());
    }
}