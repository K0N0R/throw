import { IPos, Shape } from './../utils/model';
import { getDistance, getDistanceToSegment } from './../utils/vector';
import { ObjectBase } from './objectBase';
import { GameMap } from './gameMap';

export interface CollisionSide {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
};

export class Collision {

    public static mapCollision(object: ObjectBase): CollisionSide {
        const objBRect = object.getBoundingRect();

        const collision: CollisionSide = {
            top: false,
            bottom: false,
            left: false,
            right: false,
        };

        if (objBRect.right >= GameMap.size.width) {
            collision.right = true;
        }

        if (objBRect.left <= 0) {
            collision.left = true;
        }

        if (objBRect.bottom >= GameMap.size.height) {
            collision.bottom = true;
        }
        
        if (objBRect.top <= 0) {
            collision.top = true;
        }

        return collision;
    }

    public static getStatic(): ObjectBase[] {
        return GameMap.circles;
    }

    public static checkCollision(object: ObjectBase): boolean {
        const objBRect = object.getBoundingRect();
        const collisions = this.getStatic().filter(staticObject => {
            const staticBRect = staticObject.getBoundingRect();
            switch (staticObject.shape) {
                case Shape.Circle:
                    const distance: number = getDistance(object.pos, staticObject.pos);
                    if (distance <= object.radius + staticObject.radius) {
                        staticObject.color = 'white';
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
                        staticObject.color = 'white';
                        return staticObject;
                    }
                    break;
            }
        });
        return collisions.length > 0;
    }

    public static checkCollisionForSegments(predictObject: ObjectBase):CollisionSide {
        const getStaticSegmentSide = (segment: { start: IPos; end: IPos }): boolean => {
            const distance = getDistanceToSegment(segment, predictObject.pos);
            if (distance < predictObject.radius) {
                return true;
            }
        };

        const collisionSide: any = { top: false, bottom: false, left: false, right: false };
        for(let i = 0; i< this.getStatic().length; i++) {
            const staticObj = this.getStatic()[i];
            const staticSegments: any = staticObj.getSegments();
            for (const key in staticSegments) {
                const sideCollision = getStaticSegmentSide(staticSegments[key]);
                collisionSide[key] = sideCollision != null ? sideCollision : collisionSide[key];
            }
        };       

        return collisionSide;
    }
}