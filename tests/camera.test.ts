import test from 'node:test';
import assert from 'node:assert/strict';
import { GameCamera, GAME_VIEWPORT as view, edgeIndicator } from '../frontend/game/camera';
const large = { id: 'large-rounded', skin: 'grass' };
const inside = (point: { x: number; y: number }) =>
    point.x >= view.x &&
    point.x <= view.x + view.width &&
    point.y >= view.y &&
    point.y <= view.y + view.height;

test('classic and spectator camera fit the pitch including both goals', () => {
    for (const id of ['classic', 'large-rounded']) {
        const camera = new GameCamera();
        camera.update({ id, skin: 'grass' }, null, { x: 12, y: 6 }, 1 / 60);
        const width = id === 'classic' ? 24 : 40,
            height = id === 'classic' ? 12 : 22;
        for (const point of [
            { x: -1.4, y: height / 2 },
            { x: width + 1.4, y: height / 2 },
            { x: 0, y: 0 },
            { x: width, y: height },
        ])
            assert.ok(inside(camera.screen(point)));
    }
});
test('following camera eases toward player and frames a nearby ball', () => {
    const camera = new GameCamera();
    camera.update(large, { x: 5, y: 11 }, { x: 6, y: 11 }, 1 / 60);
    const before = camera.x;
    camera.update(large, { x: 20, y: 11 }, { x: 22, y: 11 }, 1 / 60);
    assert.ok(camera.x > before && camera.x < 20);
    for (let i = 0; i < 180; i++) camera.update(large, { x: 20, y: 11 }, { x: 22, y: 11 }, 1 / 60);
    assert.ok(inside(camera.screen({ x: 20, y: 11 })));
    assert.ok(inside(camera.screen({ x: 22, y: 11 })));
    const nearby = camera.zoom;
    for (let i = 0; i < 180; i++) camera.update(large, { x: 5, y: 2 }, { x: 39, y: 21 }, 1 / 60);
    assert.ok(camera.zoom < nearby);
    assert.ok(camera.zoom >= 0.62);
    assert.ok(inside(camera.screen({ x: 5, y: 2 })));
});
test('camera damping is independent of refresh rate for a stable target', () => {
    const a = new GameCamera(),
        b = new GameCamera();
    for (const camera of [a, b]) camera.update(large, { x: 5, y: 11 }, { x: 6, y: 11 }, 1 / 60);
    for (let i = 0; i < 60; i++) a.update(large, { x: 20, y: 11 }, { x: 21, y: 11 }, 1 / 60);
    for (let i = 0; i < 120; i++) b.update(large, { x: 20, y: 11 }, { x: 21, y: 11 }, 1 / 120);
    assert.ok(Math.abs(a.x - b.x) < 0.001);
    assert.ok(Math.abs(a.zoom - b.zoom) < 0.001);
});
test('edge arrows hide visible targets and project far targets onto all four edges', () => {
    assert.equal(edgeIndicator({ x: 800, y: 505 }), null);
    for (const point of [
        { x: -100, y: 505 },
        { x: 2000, y: 505 },
        { x: 800, y: -100 },
        { x: 800, y: 1500 },
        { x: -100, y: -100 },
    ]) {
        const marker = edgeIndicator(point)!;
        assert.ok(marker);
        assert.ok(inside(marker));
        assert.ok(Number.isFinite(marker.angle));
        assert.ok(marker.x >= view.x + 30 - 0.001 && marker.x <= view.x + view.width - 30 + 0.001);
        assert.ok(marker.y >= view.y + 30 - 0.001 && marker.y <= view.y + view.height - 30 + 0.001);
    }
});
