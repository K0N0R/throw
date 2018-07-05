import { IPos, Shape, Disposable } from './../utils/model';
import { getDistance, normalizeVector } from './../utils/vector';
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
        const closestObjects = this.closestObjects(object);
        if (closestObjects.shift()) {
            // collision happend
            this.calculateObjectRotationVector(closestObjects, object, oldPosition);
        } 
    }

    private static closestObjects(object: ObjectBase) {
        return this.staticObjects.filter(staticObject => {
            switch(staticObject.shape) {
                case Shape.Circle:
                    const distance: number = getDistance(object.pos, staticObject.pos);
                    if (distance <= object.shift + staticObject.shift) {
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
                        return staticObject;
                    }
                    break;
            }
        });
    }
    
    private static calculateObjectRotationVector(closestObjects: ObjectBase[], object: ObjectBase, oldPosition: IPos) {  
        closestObjects.forEach(closest => {
            //const closest = closestObjects[0];
            closest.color = 'blue';
            const topLeft = { x: closest.pos.x - closest.shift, y: closest.pos.y - closest.shift };
            const topRight = { x: closest.pos.x + closest.shift, y: closest.pos.y - closest.shift };
            const bottomLeft = { x: closest.pos.x - closest.shift, y: closest.pos.y + closest.shift };
            const bottomRight = { x: closest.pos.x + closest.shift, y: closest.pos.y + closest.shift };
            const normalizedMoveVector = normalizeVector(object.moveVector);
            object.pos = oldPosition;
            
            if ((topLeft.x <= object.pos.x + object.shift || topRight.x >= object.pos.x - object.shift) &&
                (topLeft.y >= object.pos.y + object.shift && topRight.y >= object.pos.y + object.shift))  {
                // TOP
                console.log('TOP WALL')
                console.log(topLeft)
                object.pos.y = topLeft.y - object.shift;
                object.moveVector.y *= -1;
                console.log('-------------------', object.moveVector);
                
            }
            if ((topLeft.x >= object.pos.x + object.shift && bottomLeft.x >= object.pos.x + object.shift) &&
                (topLeft.y >= object.pos.y + object.shift || bottomLeft.y >= object.pos.y - object.shift))  {
                // LEFT
                console.log('LEFT WALL')
                console.log(topLeft)
                object.pos.x = topLeft.x - object.shift;
                object.moveVector.x *= -1;
                console.log('-------------------', object.moveVector);
            }
            if ((topRight.x <= object.pos.x - object.shift && bottomRight.x <= object.pos.x - object.shift) &&
                (topRight.y <= object.pos.y + object.shift || bottomRight.y >= object.pos.y - object.shift))  {
                // RIGHT
                console.log('RIGHT WALL')
                console.log(bottomRight)
                object.pos.x = bottomRight.x + object.shift;
                object.moveVector.x *= -1;
                console.log('-------------------', object.moveVector);
            }
            if ((bottomLeft.x <= object.pos.x + object.shift || bottomRight.x >= object.pos.x - object.shift) &&
                (bottomLeft.y <= object.pos.y - object.shift && bottomRight.y <= object.pos.y - object.shift))  {
                // BOTTOM
                console.log('BOTTOM WALL')
                console.log(bottomRight)
                object.pos.y = bottomRight.y + object.shift;
                object.moveVector.y *= -1;
                console.log('-------------------', object.moveVector);
            }
         });

    }
}