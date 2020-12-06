import { map_config, MapKind } from './../../shared/callibration';
import { POWERUP_KIND } from '../../shared/powerup';
import { IPos } from './../../shared/model';

export class Powerup {
    public pos: IPos;
    public kind!: POWERUP_KIND;
    public stateChanged: boolean = false;

    public constructor(private mapKind: MapKind) {
        this.pos = { x: -1000, y: -1000 };
    }

    public setRandomPower(): void {
        const keys = Object.values(POWERUP_KIND);
        const randomIndex = Math.round((Math.random() * (keys.length - 1)));
        this.kind = keys[randomIndex];
        console.log(this.kind, 'setRandPower');
        this.stateChanged = true;
    }

    public setRandomPosition(): void {
        const presetPos = [
            { x: map_config[this.mapKind].outerSize.width/4, y: map_config[this.mapKind].outerSize.height/4 }, // lewy gorny
            { x: map_config[this.mapKind].outerSize.width/4, y: map_config[this.mapKind].outerSize.height* 3/4 }, // lewy dolny
            { x: map_config[this.mapKind].outerSize.width* 3/4, y: map_config[this.mapKind].outerSize.height/4 }, // prawy gorny
            { x: map_config[this.mapKind].outerSize.width* 3/4, y: map_config[this.mapKind].outerSize.height* 3/4 }, // prawy dolny
            { x: map_config[this.mapKind].outerSize.width /2, y: map_config[this.mapKind].outerSize.height* 1/4 }, // srodek gorny
            { x: map_config[this.mapKind].outerSize.width /2, y: map_config[this.mapKind].outerSize.height* 3/4 }, // srodek dolny
        ]
        const randomIndex = Math.round((Math.random() * (presetPos.length - 1)));
        this.pos = presetPos[randomIndex];
        console.log(this.pos, 'setRandomPosition');
        this.stateChanged = true;
    }

    public setRandom(): void {
        this.setRandomPower();
        this.setRandomPosition();
    }

    public reset(): void {
        this.pos = { x: -1000, y: -1000 };
        this.stateChanged = true;
    }
}
