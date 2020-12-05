import { MapKind } from './../../shared/callibration';
import { POWERUP_KIND } from '../../shared/powerup';
import { IPos } from './../../shared/model';

export class Powerup {
    public pos: IPos;
    public kind: POWERUP_KIND;

    public constructor(private mapKind: MapKind) {
        this.pos = { x: -1000, y: -1000 };

        // TODO: losu losu
        this.kind = POWERUP_KIND.DASH;
    }
}
