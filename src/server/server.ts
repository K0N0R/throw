import express from 'express';
import http from 'http';
import path from 'path';
import socketIO from 'socket.io';

import { ticker } from './utils/loop';
import { Game } from './models/game';

const app = express();
const httpServer = http.createServer(app);
const io = socketIO(httpServer);

const PORT = 3000;
const HOST = 'localhost';
const ENV = process.argv.find((arg) => arg.includes('dist')) ? 'production' : 'development';
const BASE_PATH = (ENV === 'production' ? __dirname + '/../' : __dirname + '/../../dist');


app.get('/', (_req: any, res: any) => {
    res.sendFile(path.resolve(BASE_PATH + '/client/index.html'));
});

app.use(express.static(path.resolve(BASE_PATH + '/client')));

httpServer.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

// ---------------- GAME

const game = new Game(io);
setInterval((time: number) => {
    game.run(time);
});

