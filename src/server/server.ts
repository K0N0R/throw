import express from 'express';
import http from 'http';
import path from 'path';
import socketIO from 'socket.io';
import Bundler from 'parcel-bundler';
import { host, port } from './../shared/serverConfig';
import { Lobby } from './lobby/lobby';

const app = express();
const httpServer = http.createServer(app);
const io = socketIO(httpServer);

const ENV = process.argv.find((arg) => arg.includes('dist')) ? 'production' : 'development';
const bundler = new Bundler(path.resolve(__dirname, '../client/index.html'));

app.use(bundler.middleware());

httpServer.listen(port, host);
console.log(`Running on http://${host}:${port}`);

new Lobby(io);



