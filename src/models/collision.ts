import { IPos, Shape, Disposable } from './../utils/model';
import { getDistance } from './../utils/vector';
import { ObjectBase } from './objectBase';
import { CollisionSide } from './collision';

export interface CollisionSide {
    horizontal: boolean;
    vertical: boolean
}

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

    public static findCollisions(object: ObjectBase) {
        const objBRect = object.getBoundingRect();
        return this.staticObjects.filter(staticObject => {
            const staticBRect = staticObject.getBoundingRect();
            const staticPoints = staticObject.getPoints();
            switch (staticObject.shape) {
                case Shape.Circle:
                    const distance: number = getDistance(object.pos, staticObject.pos);
                    if (distance <= object.radius + staticObject.radius) {
                        staticObject.color = 'blue';
                        return staticObject;
                    }
                    break;
                case Shape.Square:
                    //TOP/DOWN
                    let insideHorizontal: boolean;
                    if (!(objBRect.left >= staticBRect.right || objBRect.right <= staticBRect.left)) {
                        insideHorizontal = true;
                    }

                    let insideVertical: boolean;
                    if (!(objBRect.top >= staticBRect.bottom || objBRect.bottom <= staticBRect.top)) {
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

    public static checkCollision(object: ObjectBase): boolean {
        const collisions = this.findCollisions(object);
        return collisions.length > 0;
    }

    public static checkSideOfCollision(predict: ObjectBase, original: ObjectBase): CollisionSide {
        const collisions = this.findCollisions(predict);
        if (collisions.length > 0) {
            return this.findCollisionSides(collisions, original);
        } else {
            return {
                horizontal: false,
                vertical: false
            }
        }
    }

    public static findCollisionSides(collisions: ObjectBase[], object: ObjectBase): CollisionSide {
        const collisionSides = { horizontal: false, vertical: false };
        collisions.forEach(collisionObj => {

            const collisionAngl = collisionObj.getAngles();
            const objBRect = object.getBoundingRect();

            if (!collisionSides.horizontal &&
                // TOP
                (((collisionAngl.topLeft.y >= objBRect.bottom) && (collisionAngl.topLeft.x <= objBRect.right || collisionAngl.topRight.x >= objBRect.left))
                    ||
                    // BOTTOM
                    ((collisionAngl.bottomLeft.y <= objBRect.top) && (collisionAngl.bottomLeft.x <= objBRect.right || collisionAngl.bottomRight.x >= objBRect.left)))
            ) {
                collisionSides.horizontal = true;
            }

            if (!collisionSides.vertical &&
                // LEFT
                (((collisionAngl.topLeft.x >= objBRect.right) && (collisionAngl.topLeft.y <= objBRect.bottom || collisionAngl.bottomLeft.y >= objBRect.top))
                    ||
                    // RIGHT
                    ((collisionAngl.topRight.x <= objBRect.left) && (collisionAngl.topRight.y <= objBRect.bottom || collisionAngl.bottomRight.y >= objBRect.top)))
            ) {
                collisionSides.vertical = true;
            }
        });
        return collisionSides;
    }

    public static checkCollisionForPoints(predictObject: ObjectBase) {
        const getStaticPointSide = (points: IPos[]): boolean => {
            for (let i = 0; i < points.length; i++) {
                const distance: number = getDistance(predictObject.pos, points[i]);
                if (distance < predictObject.radius) {
                    return true;
                }
            }
        }
        const collisionSide: any = { top: false, bottom: false, left: false, right: false };
        for(let i = 0; i< this.staticObjects.length; i++) {
            const staticObj = this.staticObjects[i];
            const staticPoints: any = staticObj.getPoints();
            for (const key in staticPoints) {
                const sideCollision = getStaticPointSide(staticPoints[key]);
                collisionSide[key] = sideCollision != null ? sideCollision : collisionSide[key];
            }
        };

        return collisionSide;
    }
}