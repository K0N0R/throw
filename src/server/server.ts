import express from 'express';
import http from 'http';
import path from 'path';
import socketIO from 'socket.io';

import { Game } from './models/game';
import { host, port } from './../shared/serverConfig';
import { game_config } from './../shared/callibration';

const app = express();
const httpServer = http.createServer(app);
const io = socketIO(httpServer);

const ENV = process.argv.find((arg) => arg.includes('dist')) ? 'production' : 'development';
const BASE_PATH = (ENV === 'production' ? __dirname + '/../' : __dirname + '/../../dist/');

app.get('/', (_req: any, res: any) => {
    res.sendFile(path.resolve(BASE_PATH + 'client/index.html'));
});

app.use(express.static(path.resolve(BASE_PATH + '/client')));

httpServer.listen(port, host);
console.log(`Running on http://${host}:${port}`);

// ---------------- GAME
const game = new Game(io);
setInterval(() => {
    game.run();
}, 0);





