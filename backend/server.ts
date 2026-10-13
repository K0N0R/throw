import { monitorRuntime } from './game/runtimeMetrics';
import express from 'express';
import http from 'http';
import path from 'path';
import { attachLobby } from './lobby/directory';
import { attachMatch } from './game/match';

export async function createGameServer(publicPath = path.resolve(__dirname, 'public')) {
    const app = express();
    const server = http.createServer(app);
    const match = await attachMatch(server, { noServer: true });
    const lobby = attachLobby(server, match);
    const runtime = monitorRuntime();
    app.use(express.static(publicPath));
    app.get('/metrics', (_request, response) =>
        response.json({
            schemaVersion: 2,
            runtime: runtime.snapshot(),
            ...match.metrics(),
            rooms: lobby.metrics(),
        }),
    );
    server.on('close', () => {
        runtime.dispose();
        lobby.dispose();
        match.dispose();
    });
    return { server, match, lobby };
}
