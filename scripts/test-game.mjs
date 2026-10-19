import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
await mkdir('dist/tests', { recursive: true });
for (const name of [
    'simulation',
    'network',
    'prediction',
    'lobby',
    'matchRules',
    'roomManagement',
    'avatars',
    'lobbyClient',
    'energy',
    'loadReport',
    'arenas',
    'camera',
    'soundEvents',
]) {
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
        'dist/tests/lobby.test.cjs',
        'dist/tests/matchRules.test.cjs',
        'dist/tests/roomManagement.test.cjs',
        'dist/tests/avatars.test.cjs',
        'dist/tests/lobbyClient.test.cjs',
        'dist/tests/energy.test.cjs',
        'dist/tests/loadReport.test.cjs',
        'dist/tests/arenas.test.cjs',
        'dist/tests/camera.test.cjs',
        'dist/tests/soundEvents.test.cjs',
    ],
    { stdio: 'inherit' },
);
process.exitCode = result.status ?? 1;
