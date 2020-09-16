import { Canvas } from './canvas';
import { Collision } from './collision';
import { GameMap } from './gameMap';
import { Player } from './player';
import { MouseHandler } from './mouseHandler';
import { EventManager } from './eventManager';
import { ObjectBase } from './objectBase';
import { Circle } from './circle';
import { getDistance } from '../utils/vector';

export class GameField {
    private static players: Player[] = [];
    public static init() {
        MouseHandler.bindEvents();

        Canvas.createCanvas();
        Canvas.width = 1980;
        Canvas.height = 1980;

        GameMap.createMap();

        const newPlayer = new Player({ x: GameMap.size.width/2, y: GameMap.size.height/2 });
        this.players.push(newPlayer);

        this.bindEvents();
    }

    private static bindEvents(): void {
        EventManager.add({
            event: 'circle::move',
            handler: (circle: Circle) => {
                const predictObject = new ObjectBase({
                    x: circle.pos.x + circle.moveVector.x,
                    y: circle.pos.y + circle.moveVector.y
                }, circle.shape, circle.size);

                const sides = Collision.mapCollision(predictObject);
                if (sides.top || sides.bottom) {
                    circle.moveVector.y *= -1;
                }
                if (sides.left || sides.right) {
                    circle.moveVector.x *= -1;
                }

                if (getDistance(circle.pos, this.players[0].pos) < 60) {
                    circle.grow(this.players[0]);
                } else {
                    circle.shrink(this.players[0]);
                }
            }
        })

        EventManager.add({
            event: 'player::move',
            handler: (player: Player) => {
                const predictObject = new ObjectBase({
                    x: player.pos.x + player.moveVector.x,
                    y: player.pos.y + player.moveVector.y
                }, player.shape, player.size);

                const sides = Collision.mapCollision(predictObject);
                if (sides.top || sides.bottom) {
                    player.moveVector.y *= -1;
                }
                if (sides.left || sides.right) {
                    player.moveVector.x *= -1;
                }

            }
        });
    }

    public static run() {
        Canvas.clearCanvas();
        this.logic();
        this.render();
    }

    private static logic(): void {

        GameMap.logic();
        this.players.forEach(p => p.logic());
    }

    public static render(): void {
        GameMap.render();
    }
}