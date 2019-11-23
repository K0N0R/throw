import io from 'socket.io-client';
import { Game } from './models/game';

const socket = io({
    host: 'localhost:3000'
});

new Game(socket);
