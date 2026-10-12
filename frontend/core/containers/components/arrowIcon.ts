import { Icon } from './icon';
export class ArrowUpIcon extends Icon {
    constructor() {
        super({ sprite: 'arrow-up.png' });
    }
}
export class ArrowDownIcon extends Icon {
    constructor() {
        super({ sprite: 'arrow-up.png' });
        this.sprite.rotation = Math.PI;
    }
}
