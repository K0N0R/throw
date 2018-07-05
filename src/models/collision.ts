import { IPos, Shape, Disposable } from './../utils/model';
import { getDistance } from './../utils/vector';
import { ObjectBase } from './objectBase';

export class Collision {
    private static staticObjects: ObjectBase[] = [];
    private static movableObjects: ObjectBase[] = [];

    public static addStatic(object: ObjectBase): Disposable {
        this.staticObjects.push(object);
        const lastIdx = this.staticObjects.length - 1;
        return (): void => {
            this.staticObjects.splice(lastIdx);
        };
    }

    public static checkCollision(object: ObjectBase): boolean {
        const closestObjects = this.closestObjects(object);
        return closestObjects.shift() !== void 0;
    }

    public static stopOnCollision(object: ObjectBase, oldPosition: IPos): void {
        const closestObjects = this.closestObjects(object);
        if (closestObjects.shift()) {
            // collision happend
            this.calculateObjectRotationVector(closestObjects, object, oldPosition);
        }
    }

    private static closestObjects(object: ObjectBase) {
        return this.staticObjects.filter(staticObject => {
            switch (staticObject.shape) {
                case Shape.Circle:
                    const distance: number = getDistance(object.pos, staticObject.pos);
                    if (distance <= object.shift + staticObject.shift) {
                        staticObject.color = 'blue';
                        return staticObject;
                    }
                    break;
                case Shape.Square:
                    //TOP/DOWN
                    let insideHorizontal: boolean;
                    if (!(object.pos.x - object.shift >= staticObject.pos.x + staticObject.shift ||
                        object.pos.x + object.shift <= staticObject.pos.x - staticObject.shift)) {
                        insideHorizontal = true;
                    }

                    let insideVertical: boolean;
                    if (!(object.pos.y - object.shift >= staticObject.pos.y + staticObject.shift ||
                        object.pos.y + object.shift <= staticObject.pos.y - staticObject.shift)) {
                        insideVertical = true;
                    }
                    if (insideHorizontal && insideVertical) {
                        staticObject.color = 'blue';
                        return staticObject;
                    }
                    break;
            }
        });
    }

    private static calculateObjectRotationVector(closestObjects: ObjectBase[], object: ObjectBase, oldPosition: IPos) {
        object.pos = oldPosition;
        const objectCollision = { horizontal: false, vertical: false };
        closestObjects.forEach(closest => {

            const topLeft = { x: closest.pos.x - closest.shift, y: closest.pos.y - closest.shift };
            const topRight = { x: closest.pos.x + closest.shift, y: closest.pos.y - closest.shift };
            const bottomLeft = { x: closest.pos.x - closest.shift, y: closest.pos.y + closest.shift };
            const bottomRight = { x: closest.pos.x + closest.shift, y: closest.pos.y + closest.shift };

            if (
                // TOP
                ((topLeft.x <= object.pos.x + object.shift || topRight.x >= object.pos.x - object.shift) &&
                    (topLeft.y >= object.pos.y + object.shift && topRight.y >= object.pos.y + object.shift))
                ||
                // BOTTOM
                ((bottomLeft.x <= object.pos.x + object.shift || bottomRight.x >= object.pos.x - object.shift) &&
                    (bottomLeft.y <= object.pos.y - object.shift && bottomRight.y <= object.pos.y - object.shift))
            ) {
                objectCollision.horizontal = true;
                object.moveVector.y *= -0.75;
            }

            if (
                // LEFT
                ((topLeft.x >= object.pos.x + object.shift && bottomLeft.x >= object.pos.x + object.shift) &&
                    (topLeft.y >= object.pos.y + object.shift || bottomLeft.y >= object.pos.y - object.shift))
                ||
                // RIGHT
                ((topRight.x <= object.pos.x - object.shift && bottomRight.x <= object.pos.x - object.shift) &&
                    (topRight.y <= object.pos.y + object.shift || bottomRight.y >= object.pos.y - object.shift))
            ) {
                objectCollision.vertical = true;
                object.moveVector.x *= -0.75;
            }
        });

        if (!objectCollision.horizontal) {
            object.pos.x = object.pos.x + object.moveVector.x;
        }
        if (!objectCollision.vertical) {
            object.pos.y = object.pos.y + object.moveVector.y;
        }
    }
}