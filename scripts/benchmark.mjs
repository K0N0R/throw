import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
await mkdir('dist/tests', { recursive: true });
await build({
    entryPoints: ['scripts/benchmark.ts'],
    outfile: 'dist/tests/benchmark.cjs',
    bundle: true,
    platform: 'node',
    format: 'cjs',
});
const result = spawnSync(process.execPath, ['dist/tests/benchmark.cjs'], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
