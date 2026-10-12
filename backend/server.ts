import express from 'express';
import http from 'http';
import path from 'path';
import { attachMatch } from './game/match';

export async function createGameServer(publicPath = path.resolve(__dirname, 'public')) {
    const app = express();
    const server = http.createServer(app);
    const match = await attachMatch(server);
    app.use(express.static(publicPath));
    app.get('/metrics', (_request, response) => response.json(match.metrics()));
    server.on('close', () => match.dispose());
    return { server, match };
}
