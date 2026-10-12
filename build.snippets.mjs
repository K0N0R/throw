import fs from 'node:fs/promises';

export async function copyFrontendFiles(outDir, htmlReplacement = '') {
    let html = await fs.readFile('frontend/index.html', 'utf8');
    html = html.replace('<!-- inject:reload-script -->', htmlReplacement);
    await fs.writeFile(`${outDir}/public/index.html`, html);
    await copyAssets(outDir);
}

export async function copyAssets(outDir) {
    await fs.copyFile('frontend/preload-config.json', `${outDir}/public/preload-config.json`);
    await fs.cp('frontend/assets', `${outDir}/public/assets`, { recursive: true });
}
