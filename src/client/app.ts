import io from 'socket.io-client';
import { Game } from './models/game';
import { host, port } from './../shared/serverConfig';

const socket = io({
    host: `${host}:${port}`
});

new Game(socket);
