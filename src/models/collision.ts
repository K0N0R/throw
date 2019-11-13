import { IPos, Shape } from './../utils/model';
import { getDistance, getDistanceToSegment } from './../utils/vector';
import { ObjectBase } from './objectBase';
import { CollisionSide } from './collision';
import { GameMap } from './gameMap';

export interface CollisionSide {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
};

export class Collision {

    public static checkMapCollision(object: ObjectBase): CollisionSide {
        const collisionSide: CollisionSide = {
            top: false,
            bottom: false,
            left: false,
            right: false
        };
        const mapBRect = GameMap.getBoundingRect();
        const objBRect = object.getBoundingRect();

        if (mapBRect.top > objBRect.top) {
            collisionSide.top = true;
        }
        if (mapBRect.bottom < objBRect.bottom) {
            collisionSide.bottom = true;
        }
        if (mapBRect.left > objBRect.left) {
            collisionSide.left = true;
        }
        if (mapBRect.right < objBRect.right) {
            collisionSide.right = true;
        }
        return collisionSide;
    }

    // public static getStatic(): ObjectBase[] {
    //     return GameMap.bricks;
    // }

    // public static checkCollision(object: ObjectBase): boolean {
    //     const objBRect = object.getBoundingRect();
    //     const collisions = this.getStatic().filter(staticObject => {
    //         const staticBRect = staticObject.getBoundingRect();
    //         switch (staticObject.shape) {
    //             case Shape.Circle:
    //                 const distance: number = getDistance(object.pos, staticObject.pos);
    //                 if (distance <= object.radius + staticObject.radius) {
    //                     staticObject.color = 'blue';
    //                     return staticObject;
    //                 }
    //                 break;
    //             case Shape.Square:
    //                 //TOP/DOWN
    //                 let insideHorizontal: boolean;
    //                 if (!(objBRect.left >= staticBRect.right || objBRect.right <= staticBRect.left)) {
    //                     insideHorizontal = true;
    //                 }

    //                 let insideVertical: boolean;
    //                 if (!(objBRect.top >= staticBRect.bottom || objBRect.bottom <= staticBRect.top)) {
    //                     insideVertical = true;
    //                 }
    //                 if (insideHorizontal && insideVertical) {
    //                     staticObject.color = 'blue';
    //                     return staticObject;
    //                 }
    //                 break;
    //         }
    //     });
    //     return collisions.length > 0;
    // }

    // public static checkCollisionForSegments(predictObject: ObjectBase):CollisionSide {
    //     const getStaticSegmentSide = (segment: { start: IPos; end: IPos }): boolean => {
    //         const distance = getDistanceToSegment(segment, predictObject.pos);
    //         if (distance < predictObject.radius) {
    //             return true;
    //         }
    //     };

    //     const collisionSide: any = { top: false, bottom: false, left: false, right: false };
    //     for(let i = 0; i< this.getStatic().length; i++) {
    //         const staticObj = this.getStatic()[i];
    //         const staticSegments: any = staticObj.getSegments();
    //         for (const key in staticSegments) {
    //             const sideCollision = getStaticSegmentSide(staticSegments[key]);
    //             collisionSide[key] = sideCollision != null ? sideCollision : collisionSide[key];
    //         }
    //     };       

    //     return collisionSide;
    // }
}