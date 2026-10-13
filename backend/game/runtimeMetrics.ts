import { monitorEventLoopDelay, performance } from 'node:perf_hooks';

export function monitorRuntime() {
    const started = performance.now();
    const cpuStart = process.cpuUsage();
    const utilizationStart = performance.eventLoopUtilization();
    const delay = monitorEventLoopDelay({ resolution: 20 });
    delay.enable();
    const milliseconds = (value: number) => (Number.isFinite(value) ? value / 1e6 : 0);
    return {
        snapshot() {
            const cpu = process.cpuUsage(cpuStart);
            const memory = process.memoryUsage();
            return {
                uptimeSeconds: (performance.now() - started) / 1000,
                cpuMilliseconds: (cpu.user + cpu.system) / 1000,
                rssBytes: memory.rss,
                heapUsedBytes: memory.heapUsed,
                externalBytes: memory.external,
                eventLoopUtilization:
                    performance.eventLoopUtilization(utilizationStart).utilization,
                eventLoopDelay: {
                    meanMs: milliseconds(delay.mean),
                    p95Ms: milliseconds(delay.percentile(95)),
                    p99Ms: milliseconds(delay.percentile(99)),
                    maxMs: milliseconds(delay.max),
                },
            };
        },
        dispose() {
            delay.disable();
        },
    };
}
