//TODO: read from server
//import { AssetsNames } from './assets-names.json';
//

import { loadImg } from './utils/loadImg';
import { loopFnc } from './utils/loop';
import { GameField } from './models/gameField';
import { Assets, AssetKind } from './models/assets';

async function init() {
    // load
    // need to add assetsManager with just json to files
    await Assets.addAsset(AssetKind.Img, './assets/stand_right.png', 'player_model');
    GameField.init();
    loopFnc(() => {
        GameField.run();
    });
}
init();

