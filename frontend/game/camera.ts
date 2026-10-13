import { arenaShape } from '../../shared/game/arenas';
export const GAME_VIEWPORT = { x: 100, y: 175, width: 1400, height: 660 };
export interface Point {
    x: number;
    y: number;
}
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export class GameCamera {
    x = 12;
    y = 6;
    zoom = 1;
    private arenaId = '';
    update(arena: unknown, own: Point | null, ball: Point, dt: number, scale = 50) {
        const shape = arenaShape(arena),
            { width, height } = shape;
        const overviewZoom = Math.min(
            GAME_VIEWPORT.width / ((width + 4) * scale),
            GAME_VIEWPORT.height / ((height + 1.2) * scale),
        );
        const follow = width > 24 && own !== null;
        let x = width / 2,
            y = height / 2,
            zoom = overviewZoom;
        if (follow) {
            x = own.x + clamp(ball.x - own.x, -12, 12) * 0.35;
            y = own.y + clamp(ball.y - own.y, -8, 8) * 0.35;
            const halfX = Math.max(Math.abs(x - own.x), Math.abs(x - ball.x)) + 2.5;
            const halfY = Math.max(Math.abs(y - own.y), Math.abs(y - ball.y)) + 2.5;
            zoom = clamp(
                Math.min(
                    GAME_VIEWPORT.width / (2 * halfX * scale),
                    GAME_VIEWPORT.height / (2 * halfY * scale),
                ),
                Math.max(overviewZoom, 0.62),
                1.05,
            );
        }
        const bound = (value: number, size: number, half: number, padding: number) =>
            half * 2 >= size + padding * 2
                ? size / 2
                : clamp(value, half - padding, size + padding - half);
        x = bound(x, width, GAME_VIEWPORT.width / (2 * scale * zoom), 2);
        y = bound(y, height, GAME_VIEWPORT.height / (2 * scale * zoom), 0.6);
        const key = `${width}:${height}`;
        if (this.arenaId !== key) {
            this.arenaId = key;
            this.x = x;
            this.y = y;
            this.zoom = zoom;
        } else {
            const positionMix = 1 - Math.exp(-Math.max(0, Math.min(dt, 0.1)) / 0.22),
                zoomMix = 1 - Math.exp(-Math.max(0, Math.min(dt, 0.1)) / 0.35);
            this.x += (x - this.x) * positionMix;
            this.y += (y - this.y) * positionMix;
            this.zoom += (zoom - this.zoom) * zoomMix;
        }
        const halfW = GAME_VIEWPORT.width / (2 * scale * this.zoom),
            halfH = GAME_VIEWPORT.height / (2 * scale * this.zoom);
        this.x = bound(this.x, width, halfW, 2);
        this.y = bound(this.y, height, halfH, 0.6);
        if (follow) {
            this.x = clamp(this.x, own.x - halfW + 1, own.x + halfW - 1);
            this.y = clamp(this.y, own.y - halfH + 1, own.y + halfH - 1);
        }
    }
    screen(point: Point, scale = 50) {
        return {
            x: GAME_VIEWPORT.x + GAME_VIEWPORT.width / 2 + (point.x - this.x) * scale * this.zoom,
            y: GAME_VIEWPORT.y + GAME_VIEWPORT.height / 2 + (point.y - this.y) * scale * this.zoom,
        };
    }
    transform(scale = 50) {
        return {
            x: GAME_VIEWPORT.x + GAME_VIEWPORT.width / 2 - this.x * scale * this.zoom,
            y: GAME_VIEWPORT.y + GAME_VIEWPORT.height / 2 - this.y * scale * this.zoom,
            zoom: this.zoom,
        };
    }
}
export function edgeIndicator(point: Point, margin = 30) {
    const view = GAME_VIEWPORT;
    if (
        point.x >= view.x &&
        point.x <= view.x + view.width &&
        point.y >= view.y &&
        point.y <= view.y + view.height
    )
        return null;
    const cx = view.x + view.width / 2,
        cy = view.y + view.height / 2,
        dx = point.x - cx,
        dy = point.y - cy;
    const ratio = Math.min(
        (view.width / 2 - margin) / Math.abs(dx || 0.000001),
        (view.height / 2 - margin) / Math.abs(dy || 0.000001),
    );
    return { x: cx + dx * ratio, y: cy + dy * ratio, angle: Math.atan2(dy, dx) };
}
