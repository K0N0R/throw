import { loopFnc } from './utils/loop';
import { GameField } from './models/gameField';

function init() {
    GameField.init();
    loopFnc(() => {
        GameField.run();
    });
}
init();

