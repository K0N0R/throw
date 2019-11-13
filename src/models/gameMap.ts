import { Canvas } from './canvas';
import { Circle } from './circle';
import { IPos, ISize } from './../utils/model';
import { ObjectBase } from './objectBase';
import { Camera } from './camera';
import { normalizeVector } from './../utils/vector';

export class GameMap {
    public static size: ISize
    private static amount: number = 1250;
    public static circles: Circle[] = [];
    private static colors = [
        '#b0b8b2',
        '#ded3c0',
        '#c2d2ca',
        '#45969B',
        '#eef2f0'
    ]

    public static createMap(): void {
        this.size = {
            width: Canvas.width,
            height: Canvas.height
        }
        this.addCircles();  
    }

    private static addCircles(): void {
        for (let i = 0; i < this.amount; i++) {
            const generatedBrick = this.generateCircle();
            this.circles.push(generatedBrick);
        }
    }

    private static generateCircle(): Circle {
        const posY = Math.round(Math.random() * this.size.height);
        const posX = Math.round(Math.random() * this.size.width);
        const pos = { x: posX, y: posY};

        const vectorY = -1 + Math.random() * 1;
        const vectorX = -1 + Math.random() * 2;
        const moveVector = normalizeVector({ x: vectorX, y: vectorY});
        moveVector.x *= 2;
        moveVector.y *= 2;

        const color = this.colors[Math.round(Math.random() * (this.colors.length - 1) )];

        return new Circle(pos, color, moveVector)
    }

    public static logic(): void {
        this.circles.forEach((object: Circle) => {
            object.logic();
        });
    }

    public static render(): void {
        this.circles.forEach((object: Circle) => {
            object.render();
        });
    }
}