import { Simulation } from '../shared/game/simulation';
async function main() {
    for (const count of [1, 10, 50]) {
        const games: Simulation[] = [];
        for (let i = 0; i < count; i++) games.push(await Simulation.create(true));
        const costs: number[] = [];
        for (let frame = 0; frame < 360; frame++) {
            const start = performance.now();
            for (const game of games)
                game.step([
                    { x: frame % 120 < 60 ? 1 : -1, y: 0.4, shoot: true },
                    { x: frame % 120 < 60 ? -1 : 1, y: -0.4, shoot: true },
                ]);
            if (frame >= 60) costs.push(performance.now() - start);
        }
        costs.sort((a, b) => a - b);
        const average = costs.reduce((a, b) => a + b, 0) / costs.length;
        console.log(
            JSON.stringify({
                matches: count,
                avgBatchMs: average,
                p95BatchMs: costs[Math.floor(costs.length * 0.95)],
                estimatedCorePercentAt60Hz: (average * 60) / 10,
            }),
        );
        for (const game of games) game.dispose();
    }
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
