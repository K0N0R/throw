import esbuild from 'esbuild';
import fs from 'node:fs/promises';
import { generatePreloadConfig } from './generate-preload-config.mjs';
import { copyFrontendFiles } from './build.snippets.mjs';

const OUT_DIR = 'dist/release';

async function cleanRelease() {
    console.log('🧹 Cleaning release folder...');
    await fs.rm(OUT_DIR, { recursive: true, force: true });
    await fs.mkdir(`${OUT_DIR}/public/assets`, { recursive: true });
}

async function buildCss() {
    console.log('🎨 Building CSS...');
    await esbuild.build({
        entryPoints: ['frontend/main.css'],
        bundle: true,
        minify: true,
        outfile: `${OUT_DIR}/public/index.css`,
        loader: { '.css': 'css', '.png': 'file', '.ttf': 'file' },
        assetNames: 'fonts/[name]',
    });
}

async function buildFrontend() {
    console.log('🧱 Building frontend...');
    await esbuild.build({
        entryPoints: ['frontend/index.ts'],
        bundle: true,
        minify: true,
        define: { DEBUG: 'false' },
        outfile: `${OUT_DIR}/public/index.js`,
        format: 'esm',
    });
}

async function buildBackend() {
    console.log('🖥️ Building backend...');
    await esbuild.build({
        entryPoints: ['backend/index.ts'],
        bundle: true,
        minify: true,
        outfile: `${OUT_DIR}/server.js`,
        platform: 'node',
    });
}

async function main() {
    await generatePreloadConfig();
    await cleanRelease();
    await copyFrontendFiles(OUT_DIR);

    await Promise.all([buildCss(), buildFrontend(), buildBackend()]);

    console.log('✅ Release build complete');
}

main();
