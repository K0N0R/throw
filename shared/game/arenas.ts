export const ARENAS = {
    classic: {
        name: 'Klasyczne',
        width: 24,
        height: 12,
        cornerRadius: 0,
        goalHeight: 3.6,
        goalDepth: 1.4,
    },
    rounded: {
        name: 'Zaokrąglone',
        width: 24,
        height: 12,
        cornerRadius: 2.8,
        goalHeight: 3.6,
        goalDepth: 1.4,
    },
    large: {
        name: 'Duże',
        width: 40,
        height: 22,
        cornerRadius: 0,
        goalHeight: 4.8,
        goalDepth: 1.4,
    },
    'large-rounded': {
        name: 'Duże zaokrąglone',
        width: 40,
        height: 22,
        cornerRadius: 4,
        goalHeight: 4.8,
        goalDepth: 1.4,
    },
} as const;
export type ArenaId = keyof typeof ARENAS;
export const ARENA_SKINS = {
    grass: {
        name: 'Trawa',
        ground: 0x183d43,
        stripe: 0x234d50,
        line: 0x8cbbb8,
        surround: 0x102c36,
    },
    night: { name: 'Noc', ground: 0x17243a, stripe: 0x223454, line: 0x96acdc, surround: 0x101b2e },
    ice: { name: 'Lód', ground: 0x85aeb9, stripe: 0x9dc1c9, line: 0xe8f6ff, surround: 0x33505e },
} as const;
export interface ArenaSettings {
    id: ArenaId;
    skin: keyof typeof ARENA_SKINS;
}
export const DEFAULT_ARENA: ArenaSettings = { id: 'classic', skin: 'grass' };
export function validArena(value: unknown): value is ArenaSettings {
    if (!value || typeof value !== 'object') return false;
    const { id, skin } = value as ArenaSettings;
    return Object.hasOwn(ARENAS, id) && Object.hasOwn(ARENA_SKINS, skin);
}
export function arenaSettings(value: unknown): ArenaSettings {
    return validArena(value) ? { id: value.id, skin: value.skin } : { ...DEFAULT_ARENA };
}
export function arenaShape(value: unknown) {
    return ARENAS[arenaSettings(value).id];
}
export function arenaEnergyPads(arena: unknown) {
    const { width, height } = arenaShape(arena);
    return [height / 6, (height * 5) / 6].flatMap((y) =>
        [width / 6, width / 2, (width * 5) / 6].map((x) => ({ x, y })),
    );
}
export interface WallSegment {
    a: { x: number; y: number };
    b: { x: number; y: number };
    outward: { x: number; y: number };
}
export function cornerWalls(arena: unknown): WallSegment[] {
    const { width: w, height: h, cornerRadius: r } = arenaShape(arena);
    if (!r) return [];
    const corners = [
        { x: r, y: r, start: Math.PI },
        { x: w - r, y: r, start: Math.PI * 1.5 },
        { x: w - r, y: h - r, start: 0 },
        { x: r, y: h - r, start: Math.PI / 2 },
    ];
    return corners.flatMap((corner) =>
        Array.from({ length: 16 }, (_, i) => {
            const angle = corner.start + (i * Math.PI) / 32,
                next = angle + Math.PI / 32,
                middle = (angle + next) / 2;
            return {
                a: { x: corner.x + Math.cos(angle) * r, y: corner.y + Math.sin(angle) * r },
                b: { x: corner.x + Math.cos(next) * r, y: corner.y + Math.sin(next) * r },
                outward: { x: Math.cos(middle), y: Math.sin(middle) },
            };
        }),
    );
}
export function projectToPitch(point: { x: number; y: number }, radius: number, arena: unknown) {
    const { width: w, height: h, cornerRadius: r } = arenaShape(arena);
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const result = { x: clamp(point.x, radius, w - radius), y: clamp(point.y, radius, h - radius) };
    if (!r) return result;
    const cx = result.x < r ? r : result.x > w - r ? w - r : null;
    const cy = result.y < r ? r : result.y > h - r ? h - r : null;
    if (cx === null || cy === null) return result;
    const dx = result.x - cx,
        dy = result.y - cy,
        d = Math.hypot(dx, dy),
        limit = r - radius;
    if (d > limit) {
        result.x = cx + (dx / d) * limit;
        result.y = cy + (dy / d) * limit;
    }
    return result;
}
export function projectToArena(
    point: { x: number; y: number },
    radius: number,
    arena: unknown,
    ball = false,
) {
    const pitch = projectToPitch(point, radius, arena);
    if (!ball) return pitch;
    const { width, height, goalDepth, goalHeight } = arenaShape(arena);
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const corridor = {
        x: clamp(point.x, -goalDepth + radius, width + goalDepth - radius),
        y: clamp(point.y, (height - goalHeight) / 2 + radius, (height + goalHeight) / 2 - radius),
    };
    const distance = (p: { x: number; y: number }) => (p.x - point.x) ** 2 + (p.y - point.y) ** 2;
    return distance(pitch) < distance(corridor) ? pitch : corridor;
}
