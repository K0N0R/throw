import { HOST, PORT } from './../shared/serverConfig';
import express from 'express';
import http from 'http';
import path from 'path';
import socketIO from 'socket.io';
import Bundler from 'parcel-bundler';

import { Lobby } from './lobby/lobby';

const app = express();
const httpServer = http.createServer(app);
const io = socketIO(httpServer);
const bundler = new Bundler(path.resolve(__dirname, '../client/index.html'));

app.use(bundler.middleware());

httpServer.listen({ port: PORT, hostname: HOST});
console.log(`Running on http://${HOST}:${PORT}`);

new Lobby(io);



