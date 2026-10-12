import esbuild from 'esbuild';
import chokidar from 'chokidar';
import { spawn } from 'child_process';
import { WebSocket, WebSocketServer } from 'ws';
import fs from 'node:fs/promises';
import { generatePreloadConfig } from './generate-preload-config.mjs';
import { copyFrontendFiles, copyAssets } from './build.snippets.mjs';

const OUT_DIR = 'dist/development';
const liveReloadPort = 3456;
const reloadScript = `
    <script>
        const ws = new WebSocket('ws://localhost:${liveReloadPort}');
        ws.onmessage = (msg) => {
            if (msg.data === 'reload') location.reload();
        };
    </script>
    `;
const clients = new Set();
let frontendContext = null;
let backendProcess = null;

// ---------- Live Reload ----------

function notifyClients() {
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send('reload');
        }
    }
}

function setupWebSocketServer() {
    const wss = new WebSocketServer({ port: liveReloadPort });
    wss.on('connection', (ws) => {
        console.log('🌐 Client connected for reload');
        clients.add(ws);
        ws.on('close', () => clients.delete(ws));
    });
}

const liveReloadPlugin = {
    name: 'live-reload',
    setup(build) {
        build.onEnd(() => {
            console.log('🔁 Notifying clients to reload...');
            notifyClients();
        });
    },
};

// ---------- Build Helpers ----------

async function prepareFiles() {
    await fs.rm(OUT_DIR, { recursive: true, force: true });
    await fs.mkdir(`${OUT_DIR}/public/assets`, { recursive: true });
    await copyFrontendFiles(OUT_DIR, reloadScript);
}

async function buildBackend() {
    if (backendProcess) backendProcess.kill();

    try {
        await esbuild.build({
            entryPoints: ['backend/index.ts'],
            bundle: true,
            platform: 'node',
            outfile: `${OUT_DIR}/server.js`,
            sourcemap: true,
            plugins: [liveReloadPlugin],
        });

        backendProcess = spawn('node', [`${OUT_DIR}/server.js`], {
            stdio: 'inherit',
        });

        console.log('✅ Backend restarted');
    } catch (err) {
        console.error('❌ Backend build error:', err);
    }
}

async function buildFrontend() {
    try {
        frontendContext = await esbuild.context({
            entryPoints: ['frontend/index.ts'],
            bundle: true,
            outfile: `${OUT_DIR}/public/index.js`,
            sourcemap: true,
            format: 'esm',
            plugins: [liveReloadPlugin],
            define: { DEBUG: 'true' },
        });
        console.log('✅ Frontend build');
    } catch (err) {
        console.error('❌ Frontend build error:', err);
    }
}

async function buildCss() {
    try {
        await esbuild.build({
            entryPoints: ['frontend/main.css'],
            bundle: true,
            minify: true,
            outfile: `${OUT_DIR}/public/index.css`,
            loader: { '.css': 'css', '.png': 'file', '.ttf': 'file' },
        });

        console.log('✅ CSS bundled');
    } catch (err) {
        console.error('❌ CSS build error:', err);
    }
}

// ---------- Watchers ----------

function startWatchers() {
    chokidar.watch(['frontend/main.css', 'frontend/styles']).on('change', async () => {
        console.log('🎨 CSS changed');
        await buildCss();
        notifyClients();
    });

    const assetsWatcher = chokidar.watch('frontend/assets', {
        ignored: /[\\/]\~.*\.tmp$/, // ignoruj pliki tymczasowe
        ignoreInitial: true,
    });

    const handleAssetsChange = async () => {
        console.log('🎨 Assets changed');
        await generatePreloadConfig();
        await copyAssets(OUT_DIR);
        notifyClients();
    };

    assetsWatcher.on('change', handleAssetsChange);
    assetsWatcher.on('add', handleAssetsChange);
    assetsWatcher.on('unlink', handleAssetsChange);

    chokidar.watch('backend').on('change', async () => {
        console.log('🔁 Backend changed');
        await buildBackend();
    });

    frontendContext.watch(); // frontend JS/TS
    console.log('👀 Watching...');
}

// ---------- Main Setup ----------

async function main() {
    await generatePreloadConfig();
    await prepareFiles();
    await Promise.all([buildCss(), buildFrontend(), buildBackend()]);
    setupWebSocketServer();
    startWatchers(frontendContext);
}

main();
