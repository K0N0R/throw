import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
await mkdir('dist/tests', { recursive: true });
await build({
    entryPoints: ['scripts/load-server.ts', 'scripts/load-test.ts'],
    outdir: 'dist/tests',
    outExtension: { '.js': '.cjs' },
    bundle: true,
    platform: 'node',
    format: 'cjs',
});
const result = spawnSync(process.execPath, ['dist/tests/load-test.cjs', ...process.argv.slice(2)], {
    stdio: 'inherit',
});
process.exitCode = result.status ?? 1;
