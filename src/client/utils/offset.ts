import { ISize, IPos } from './model';

export interface IOffset {
    left: number;
    right: number;
    top: number;
    bottom: number;
    midVert: number;
    midHori: number;
    width: number;
    height: number;
}
export function getOffset(pos: IPos, size: ISize): IOffset {

        return {
            left: pos.x,
            right: pos.x + size.width,
            top: pos.y,
            bottom: pos.y + size.height,
            midVert: pos.y + size.height/2,
            midHori: pos.x + size.width/2,
            width: size.width,
            height: size.height
        }
    }