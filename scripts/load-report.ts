export interface ServerMetrics {
    schemaVersion: number;
    runtime: {
        uptimeSeconds: number;
        cpuMilliseconds: number;
        rssBytes: number;
        heapUsedBytes: number;
        eventLoopDelay: { meanMs: number; p95Ms: number; p99Ms: number; maxMs: number };
    };
    rooms: {
        id: string;
        match: {
            steps: number;
            droppedSeconds: number;
            inboundBytes: number;
            outboundBytes: number;
            averagePhysicsMs: number;
            maxPhysicsMs: number;
            players: number;
        };
    }[];
}
export class Samples {
    private values: number[] = [];
    private seed = 0x12345678;
    count = 0;
    sum = 0;
    maximum = 0;
    add(value: number) {
        if (!Number.isFinite(value) || value < 0) return;
        this.count++;
        this.sum += value;
        this.maximum = Math.max(this.maximum, value);
        // Bounded deterministic sampling of long runs.
        if (this.values.length < 10000) this.values.push(value);
        else {
            this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
            const index = Math.floor((this.seed / 4294967296) * this.count);
            if (index < 10000) this.values[index] = value;
        }
    }
    snapshot() {
        const sorted = [...this.values].sort((a, b) => a - b);
        const percentile = (fraction: number) =>
            sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)] ?? 0;
        return {
            samples: this.count,
            meanMs: this.count ? this.sum / this.count : 0,
            p95Ms: percentile(0.95),
            p99Ms: percentile(0.99),
            maxMs: this.maximum,
        };
    }
}
export function summarizeServer(
    before: ServerMetrics,
    after: ServerMetrics,
    roomIds: string[],
    elapsedSeconds: number,
) {
    const rooms = roomIds.map((id) => {
        const first = before.rooms.find((room) => room.id === id)?.match;
        const last = after.rooms.find((room) => room.id === id)?.match;
        if (!first || !last) throw new Error(`Missing load-test room ${id}`);
        return {
            id,
            players: last.players,
            stepsPerSecond: (last.steps - first.steps) / elapsedSeconds,
            droppedSeconds: Math.max(0, last.droppedSeconds - first.droppedSeconds),
            inboundBytesPerSecond: (last.inboundBytes - first.inboundBytes) / elapsedSeconds,
            outboundBytesPerSecond: (last.outboundBytes - first.outboundBytes) / elapsedSeconds,
            averagePhysicsMs: last.averagePhysicsMs,
            maxPhysicsMs: last.maxPhysicsMs,
        };
    });
    return {
        cpuPercentOfOneCore:
            (after.runtime.cpuMilliseconds - before.runtime.cpuMilliseconds) /
            (elapsedSeconds * 10),
        rssMiB: after.runtime.rssBytes / 1048576,
        rssGrowthMiB: (after.runtime.rssBytes - before.runtime.rssBytes) / 1048576,
        heapUsedMiB: after.runtime.heapUsedBytes / 1048576,
        heapGrowthMiB: (after.runtime.heapUsedBytes - before.runtime.heapUsedBytes) / 1048576,
        eventLoopDelaySinceServerStart: after.runtime.eventLoopDelay,
        outboundMiBPerSecond:
            rooms.reduce((sum, room) => sum + room.outboundBytesPerSecond, 0) / 1048576,
        rooms,
    };
}
