import io from 'socket.io-client';
//TODO: read from server
//import { AssetsNames } from './assets-names.json';
//

// import { loadImg } from './utils/loadImg';
//import { ticker } from './utils/loop';
import { Game } from './models/game';
// import { Assets, AssetKind } from './models/assets';

// async function init() {
    // load
    // need to add assetsManager with just json to files
    //await Assets.addAsset(AssetKind.Img, './assets/stand_right.png', 'player_model');

// }
// init();

const socket = io({
    host: 'localhost:3000'
});

new Game(socket);



