import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
await mkdir('dist/tests', { recursive: true });
for (const name of ['simulation', 'network', 'prediction']) {
    await build({
        entryPoints: [`tests/${name}.test.ts`],
        outfile: `dist/tests/${name}.test.cjs`,
        bundle: true,
        platform: 'node',
        format: 'cjs',
    });
}
const result = spawnSync(
    process.execPath,
    [
        '--test',
        'dist/tests/simulation.test.cjs',
        'dist/tests/network.test.cjs',
        'dist/tests/prediction.test.cjs',
    ],
    { stdio: 'inherit' },
);
process.exitCode = result.status ?? 1;
