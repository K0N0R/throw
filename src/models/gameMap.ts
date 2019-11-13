import { Canvas } from './canvas';
import { Brick, BrickSize } from './brick';
import { IPos, ISize, IBoundingRect } from './../utils/model';

export enum IMapScale {
    Small = 1,
    Big = 2
}

export const mapSizeSmall: ISize = {
    height: 400,
    width: 800
};

export const mapSizeBig: ISize = {
    height: 750,
    width: 1300
}

export class GameMap {
    private static pos: IPos;
    private static size: ISize;
    public static arcRadius: number;
    private static scale: IMapScale;
    private static color: 'green';
   
    // private static mapNet: (IPos[])[] = [];
    // private static bricksAmount: number = 325;
    // public static bricks: Brick[] = [];

    public static createMap(mapScale: IMapScale): void {
        this.setMapSize(mapScale);
        this.setMapPos();

        // this.createMapNet();
        // this.addBricks();
        // this.sortBricks();
        
    }

    public static getBoundingRect(): IBoundingRect {
        return {
            left: this.pos.x,
            right: this.pos.x + this.size.width,
            top: this.pos.y,
            bottom: this.pos.y + this.size.height,
            
            width: this.size.width,
            height: this.size.height
        }
    }

    private static setMapSize(mapScale: IMapScale): void {
        this.scale = mapScale;
        switch (this.scale) {
            case IMapScale.Small:
                this.size = {...mapSizeSmall};
                break;
            case IMapScale.Big:
                this.size = {...mapSizeBig};
                break;
        }
        this.arcRadius = this.size.width / 20;
    }

    private static setMapPos(): void {
        this.pos = {
            x: Canvas.width/2 - this.size.width/2,
            y: Canvas.height/2 - this.size.height/2
        };
    }

    public static render(): void {
        Canvas.ctx.save();
        Canvas.startDraw();
        Canvas.ctx.moveTo(this.pos.x + this.arcRadius, this.pos.y);
        Canvas.ctx.lineTo(this.pos.x + this.size.width - this.arcRadius, this.pos.y);
        Canvas.ctx.arcTo(
            this.pos.x + this.size.width,
            this.pos.y,
            this.pos.x + this.size.width,
            this.pos.y + this.arcRadius,
            this.arcRadius);
        Canvas.ctx.lineTo(this.pos.x + this.size.width, this.pos.y + this.size.height - this.arcRadius);
        Canvas.ctx.arcTo(
            this.pos.x + this.size.width,
            this.pos.y + this.size.height,
            this.pos.x + this.size.width - this.arcRadius,
            this.pos.y + this.size.height,
            this.arcRadius);
        Canvas.ctx.lineTo(this.pos.x + this.arcRadius, this.pos.y + this.size.height);
        Canvas.ctx.arcTo(
            this.pos.x,
            this.pos.y + this.size.height,
            this.pos.x,
            this.pos.y + this.size.height - this.arcRadius,
            this.arcRadius);
        Canvas.ctx.lineTo(this.pos.x, this.pos.y + this.arcRadius);
        Canvas.ctx.arcTo(
            this.pos.x,
            this.pos.y,
            this.pos.x + this.arcRadius,
            this.pos.y,
            this.arcRadius);
        Canvas.ctx.lineWidth = 5;
        Canvas.ctx.stroke();
        Canvas.stopDraw();
        Canvas.ctx.restore();
    }
}

    // private static createMapNet() {
    //     for (let i = 0; i < this.mapSize.height * 2; i += BrickSize) {
    //         this.mapNet.push([]);
    //         for (let k = 0; k < this.mapSize.width * 2; k += BrickSize) {
    //             this.mapNet[this.mapNet.length - 1].push({ x: i + BrickSize/2, y: k + BrickSize/2 });
    //         }
    //     }
    // }

    // private static addBricks(): void {
    //     for (let i = 0; i < this.bricksAmount; i++) {
    //         const generatedBrick = this.generateBrick();
    //         this.bricks.push(generatedBrick);
    //     }
    // }

    // private static generateBrick(): Brick {
    //     const generatedY = Math.abs(Math.round(Math.random() * (this.mapNet.length - 1)));
    //     const generatedX = Math.abs(Math.round(Math.random() * (this.mapNet[0].length - 1)));
    //     const brickPos = this.mapNet[generatedY][generatedX];
    //     if (!this.bricks.filter(b => { b.pos.x === brickPos.x && b.pos.y === brickPos.y })[0]) {
    //         return new Brick({x: brickPos.x, y: brickPos.y});
    //     } else {
    //         return this.generateBrick();
    //     }
    // }

    // private static sortBricks(): void {
    //     this.bricks.sort((a: Brick, b: Brick) => {
    //         if( a.pos.x > b.pos.x) {
    //            return a.pos.x - b.pos.x;
    //         } 
    //         if(a.pos.y > b.pos.y) {
    //            return a.pos.y - b.pos.y;
    //         }
    //     });
    // }