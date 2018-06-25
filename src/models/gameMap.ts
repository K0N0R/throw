import { Canvas } from './canvas';
import { IPos, ISize } from './../utils/model';

interface MapPartCollision {
    top?: boolean;
    left?: boolean;
    right?: boolean;
    bottom?: boolean;  
}

export interface CollisionInfo {
    changed: boolean;
    pos: IPos
}

interface MapElement {
    areaFnc: (x: number, y: number) => boolean;
    collisionFnc: (x: number, y: number, shift: number) => CollisionInfo;
    renderFnc: () => void;
}

interface MapPart {
    pos: IPos;
    size: ISize,
    corner: {
        leftTop: IPos,
        leftBottom: IPos,
        rightTop: IPos,
        rightBottom: IPos
    }
    collision: MapPartCollision
}

export class GameMap {
    private static mapElements: MapElement[] = [];

    public static render(): void {
        this.mapElements.forEach(e => {
            e.renderFnc();
        });
    }

    public static checkCollision(pos: IPos, shift: number): CollisionInfo {
        for(let i = 0; i < this.mapElements.length; i++) {
            if (this.mapElements[i].areaFnc(pos.x, pos.y)) {
                return this.mapElements[i].collisionFnc(pos.x, pos.y, shift);
            }
        }
    }

    public static createMap(): void {
        const mapParts: MapPart[] = [
            this.getMapPart(0, 0, 400, 100, { top: true, left: true, right: true}), //1
            this.getMapPart(0, 100, 400, 200, { left: true }), //2
            this.getMapPart(0, 300, 400, 100, { left: true, right: true, bottom: true}), //3
            this.getMapPart(0, 400, 300, 100, { top: true, left: true}), //4
            this.getMapPart(0, 500, 300, 100, { left: true, right: true }), //5
            this.getMapPart(0, 600, 600, 100, { left: true }), //6
            this.getMapPart(0, 700, 600, 100, { bottom: true, left: true, right: true}), //7
            this.getMapPart(400, 0, 200, 100, { top: true, left: true}), //8
            this.getMapPart(400, 100, 200, 200, { right: true}), //9
            this.getMapPart(400, 300, 200, 100, { left: true }), //10
            this.getMapPart(300, 400, 100, 100, { top: true, bottom: true}), //11
            this.getMapPart(400, 400, 200, 100, { bottom: true, right: true}), //12
            this.getMapPart(300, 500, 300, 100, { top: true, left: true}), //13
            this.getMapPart(600, 0, 400, 100, { top: true, bottom: true}), //14
            this.getMapPart(600, 100, 200, 100, { top: true, left: true }), //15
            this.getMapPart(600, 200, 200, 100, { left: true, right: true}),//16
            this.getMapPart(600, 300, 200, 100, { right: true}),//17
            this.getMapPart(600, 400, 200, 100, { left: true, right: true}), //18
            this.getMapPart(600, 500, 100, 200, { bottom: true }), //19
            this.getMapPart(700, 500, 100, 200, { right: true}), //20
            this.getMapPart(600, 700, 100, 100, { top: true, left: true, bottom: true}), //21
            this.getMapPart(700, 700, 100, 100, { bottom: true}), //22
            this.getMapPart(800, 700, 100, 100, { bottom: true, right: true}), //23
            this.getMapPart(800, 100, 200, 100, { top: true }), //24
            this.getMapPart(800, 200, 100, 200, { left: true }), //25
            this.getMapPart(900, 200, 100, 200, { bottom: true}), //26
            this.getMapPart(800, 400, 100, 300, { left: true, right: true}), //27
            this.getMapPart(900, 400, 100, 400, { top: true, left: true, bottom: true}), //28
            this.getMapPart(1000, 0, 200, 800, { top: true, right: true, bottom: true}), //29
        ];
        mapParts.forEach(p => {
            this.mapElements.push({
                areaFnc: this.setAreaFnc(p),
                collisionFnc: this.setCollisionFnc(p),
                renderFnc: this.setRenderFnc(p)
            });
        });
    }

    private static getMapPart(x: number, y: number, width: number, height: number, collision: MapPartCollision): MapPart {
        return {
            pos: {
                x: x,
                y: y
            },
            size: {
                width: width,
                height: height
            },
            corner: {
                leftTop: { x: x, y: y },
                leftBottom: { x: x, y: y + height },
                rightTop: { x: x + width, y },
                rightBottom: { x: x + width, y: y + height }
            },
            collision: {
                left: collision.left || false,
                right: collision.right || false,
                top: collision.top || false,
                bottom: collision.bottom || false
            }
        };
    }

    private static setAreaFnc(mapPart: MapPart): any {
        return (x: number, y: number) => {
            const xInside: boolean = (x > mapPart.pos.x) && (x < (mapPart.pos.x + mapPart.size.width));
            const yInside: boolean = (y > mapPart.pos.y) && (y < (mapPart.pos.y + mapPart.size.height));
            return xInside && yInside;
        };
    }

    private static setCollisionFnc(mapPart: MapPart): any {
        return (initialX: number, initialY: number, shift: number = 1) => {
            let newX: number = initialX;
            let newY: number = initialY;

            if (mapPart.collision.left) {
                if (initialX - shift < mapPart.pos.x) {
                    newX = mapPart.pos.x + shift;
                }
            }

            if (mapPart.collision.right) {
                if (initialX + shift > (mapPart.pos.x + mapPart.size.width)) {
                    newX = mapPart.pos.x + mapPart.size.width - shift;
                }
            }

            if (mapPart.collision.top) {
                if (initialY - shift < mapPart.pos.y) {
                    newY = mapPart.pos.y + shift;
                }
            }

            if (mapPart.collision.bottom) {
                if (initialY + shift > mapPart.pos.y + mapPart.size.height) {
                    newY = mapPart.pos.y + mapPart.size.height - shift;
                }
            }

            return {
                changed: newX !== initialX || newY !== initialY,
                pos: {
                    x: newX,
                    y: newY
                }
            }
        };
    }

    private static setRenderFnc(mapPart: MapPart): any {
        return () => {
            Canvas.startDraw();

            // TOP
            Canvas.ctx.moveTo(mapPart.corner.leftTop.x, mapPart.corner.leftTop.y);
            if (mapPart.collision.top) {
                Canvas.ctx.lineTo(mapPart.corner.rightTop.x, mapPart.corner.rightTop.y);
                Canvas.ctx.stroke();
            }

            // RIGHT
            Canvas.ctx.moveTo(mapPart.corner.rightTop.x, mapPart.corner.rightTop.y);
            if (mapPart.collision.right) {
                Canvas.ctx.lineTo(mapPart.corner.rightBottom.x, mapPart.corner.rightBottom.y);
                Canvas.ctx.stroke();
            }
            
            // BOTTOM
            Canvas.ctx.moveTo(mapPart.corner.rightBottom.x, mapPart.corner.rightBottom.y);
            if (mapPart.collision.bottom) {
                Canvas.ctx.lineTo(mapPart.corner.leftBottom.x, mapPart.corner.leftBottom.y);
                Canvas.ctx.stroke();
            }

            // LEFT
            Canvas.ctx.moveTo(mapPart.corner.leftBottom.x, mapPart.corner.leftBottom.y);
            if (mapPart.collision.left) {
                Canvas.ctx.lineTo(mapPart.corner.leftTop.x, mapPart.corner.leftTop.y);
                Canvas.ctx.stroke();
            }

            Canvas.stopDraw();

        };
    }
}