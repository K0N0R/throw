import { Canvas } from './canvas';
import { Brick, BrickSize } from './brick';
import { IPos, ISize } from './../utils/model';

export class GameMap {
    private static mapSize: ISize
    private static mapNet: (IPos[])[] = [];
    private static bricksAmount: number = 325;
    public static bricks: Brick[] = [];

    public static createMap(): void {
        this.mapSize = {
            width: Canvas.width,
            height: Canvas.height
        }
        this.createMapNet();
        this.addBricks();
        this.sortBricks();
        
    }

    private static createMapNet() {
        for (let i = 0; i < this.mapSize.height * 2; i += BrickSize) {
            this.mapNet.push([]);
            for (let k = 0; k < this.mapSize.width * 2; k += BrickSize) {
                this.mapNet[this.mapNet.length - 1].push({ x: i + BrickSize/2, y: k + BrickSize/2 });
            }
        }
    }

    private static addBricks(): void {
        for (let i = 0; i < this.bricksAmount; i++) {
            const generatedBrick = this.generateBrick();
            this.bricks.push(generatedBrick);
        }
    }

    private static generateBrick(): Brick {
        const generatedY = Math.abs(Math.round(Math.random() * (this.mapNet.length - 1)));
        const generatedX = Math.abs(Math.round(Math.random() * (this.mapNet[0].length - 1)));
        const brickPos = this.mapNet[generatedY][generatedX];
        if (!this.bricks.filter(b => { b.pos.x === brickPos.x && b.pos.y === brickPos.y })[0]) {
            return new Brick({x: brickPos.x, y: brickPos.y});
        } else {
            return this.generateBrick();
        }
    }

    private static sortBricks(): void {
        this.bricks.sort((a: Brick, b: Brick) => {
            if( a.pos.x > b.pos.x) {
               return a.pos.x - b.pos.x;
            } 
            if(a.pos.y > b.pos.y) {
               return a.pos.y - b.pos.y;
            }
        });
    }

    public static render(): void {
        this.bricks.forEach((brick: Brick) => {
            brick.render();
        });
    }
}