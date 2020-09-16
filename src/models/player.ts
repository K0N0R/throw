
import { MouseHandler } from './mouseHandler';
import { IPos, Shape } from './../utils/model';
import { EventManager } from './eventManager';
import { ObjectBase } from './objectBase';

export const PlayerSize = 30;

export class Player extends ObjectBase {
    public constructor(pos: IPos) {
        super(pos, Shape.Circle, PlayerSize)
    }

    private movement() {
        
        const mousePos = MouseHandler.getMousePos();
        this.pos.x = mousePos.x;
        this.pos.y =  mousePos.y;
        EventManager.notify('player::move', this);
    }

    public logic(): void {
        this.movement();
    }
}