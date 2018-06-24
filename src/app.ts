import { loadImg } from './utils/loadImg';
import { loopFnc } from './utils/loop';
import { GameField, GameFieldConfig } from './models/gameField';

async function init() {
    // load
    const config: GameFieldConfig = {
        assets: null,
    };
    GameField.init(config);
    loopFnc(() => {
        GameField.render();
    });
}
init();

