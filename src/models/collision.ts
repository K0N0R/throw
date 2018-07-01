import { IPos, Shape, Disposable } from './../utils/model';
import { getDistance } from './../utils/vector';
import { GameMap } from './gameMap';
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

    public static checkCollision(object: ObjectBase, oldPosition: IPos) {
        const closestObjects = this.staticObjects.filter(staticObject => {
            const distance: number = getDistance(object.pos, staticObject.pos);
            if (distance <= object.shift + staticObject.shift) {
                return staticObject;
            }
        });
        if (closestObjects.shift()) {
            object.pos = oldPosition
            object.pos.x = object.pos.x - (object.moveVector.x * 0.2);
            object.moveVector.x = -object.moveVector.x
            object.pos.y = object.pos.y - (object.moveVector.y * 0.2);
            object.moveVector.y = -object.moveVector.y
        }
    }
}