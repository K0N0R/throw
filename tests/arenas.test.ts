import test from 'node:test';
import assert from 'node:assert/strict';
import {
    ARENAS,
    DEFAULT_ARENA,
    arenaEnergyPads,
    validArena,
    projectToPitch,
} from '../shared/game/arenas';
import { Simulation, RULES } from '../shared/game/simulation';
import { WorldPrediction } from '../shared/game/prediction';
import type { ServerState } from '../shared/game/protocol';
const idle = { x: 0, y: 0, shoot: false };

test('arena validation rejects unknown geometry and skins; energy scales with size', () => {
    assert.ok(validArena({ id: 'large-rounded', skin: 'ice' }));
    for (const arena of [
        null,
        { id: 'custom', skin: 'grass' },
        { id: 'classic', skin: '__proto__' },
        { id: '__proto__', skin: 'grass' },
    ])
        assert.equal(validArena(arena), false);
    assert.deepEqual(arenaEnergyPads(DEFAULT_ARENA)[0], { x: 4, y: 2 });
    assert.equal(arenaEnergyPads({ id: 'large', skin: 'night' })[1].x, 20);
    const point = projectToPitch({ x: 0, y: 0 }, RULES.playerRadius, {
        id: 'rounded',
        skin: 'grass',
    });
    assert.ok(point.x > 1 && point.y > 1);
});
for (const id of Object.keys(ARENAS) as (keyof typeof ARENAS)[])
    test(`both goals and player goal boundary work on ${id}`, async () => {
        const game = await Simulation.create(2, { id, skin: 'grass' });
        try {
            const { width, height } = ARENAS[id];
            assert.equal(game.snapshot().ball.x, width / 2);
            assert.equal(game.snapshot().ball.y, height / 2);
            for (const right of [false, true]) {
                game.resetMatch();
                game.ball.setTranslation({ x: right ? width - 0.4 : 0.4, y: height / 2 }, true);
                game.ball.setLinvel({ x: right ? 16 : -16, y: 0 }, true);
                for (let i = 0; i < 20; i++) game.step([idle, idle]);
                assert.equal(game.snapshot().score[right ? 0 : 1], 1);
                for (let i = 0; i < 90; i++) game.step([idle, idle]);
                assert.equal(game.snapshot().ball.x, width / 2);
            }
            game.player.setTranslation({ x: 1, y: height / 2 }, true);
            for (let i = 0; i < 60; i++) game.step([{ x: -1, y: 0, shoot: false }, idle]);
            assert.ok(game.player.translation().x >= RULES.playerRadius - 0.03);
        } finally {
            game.dispose();
        }
    });
for (const id of ['rounded', 'large-rounded'] as const)
    test(`rounded ${id} corners constrain players and bounce a fast ball`, async () => {
        const game = await Simulation.create(false, { id, skin: 'grass' });
        try {
            const r = ARENAS[id].cornerRadius;
            game.player.setTranslation({ x: r * 0.55, y: r * 0.55 }, true);
            for (let i = 0; i < 120; i++) game.step({ x: -1, y: -1, shoot: false });
            const position = game.player.translation(),
                projected = projectToPitch(position, RULES.playerRadius, game.arena);
            assert.ok(Math.hypot(position.x - projected.x, position.y - projected.y) < 0.06);
            assert.ok(
                position.x > RULES.playerRadius + 0.3 && position.y > RULES.playerRadius + 0.3,
            );
            game.player.setTranslation({ x: ARENAS[id].width / 2, y: ARENAS[id].height / 2 }, true);
            game.ball.setTranslation({ x: r * 0.55, y: r * 0.55 }, true);
            game.ball.setLinvel({ x: -30, y: -30 }, true);
            for (let i = 0; i < 12; i++) game.step(idle);
            assert.ok(game.ball.linvel().x + game.ball.linvel().y > 0);
            assert.equal(game.snapshot().score[0] + game.snapshot().score[1], 0);
        } finally {
            game.dispose();
        }
    });
test('changing arena rebuilds only walls, preserves membership and restores large prediction geometry', async () => {
    const server = await Simulation.create(10),
        client = await Simulation.create(10);
    try {
        server.setConnectedSeats([0, 3, 8]);
        const originalColliders = server.world.colliders.len();
        for (let i = 0; i < 5; i++) {
            server.configureArena({ id: 'large-rounded', skin: 'night' });
            server.configureArena(DEFAULT_ARENA);
        }
        assert.equal(
            server.world.colliders.len(),
            originalColliders,
            'Repeated arena changes do not accumulate walls',
        );
        server.configureArena({ id: 'large-rounded', skin: 'night' });
        assert.deepEqual(
            server.snapshot().players.map((p) => p.active),
            [true, false, false, true, false, false, false, false, true, false],
        );
        server.players[0].setTranslation({ x: 35, y: 15 }, true);
        const prediction = new WorldPrediction(client);
        const state: ServerState = {
            type: 'state',
            tick: 1,
            time: 0,
            ready: true,
            ack: Array(10).fill(0),
            inputs: Array(10).fill(idle),
            game: server.snapshot(),
        };
        prediction.reconcile(state, 0, []);
        assert.equal(client.arena.id, 'large-rounded');
        assert.equal(
            prediction.snapshot().player.x,
            35,
            'Presentation must not clamp to old 24-unit pitch',
        );
        assert.equal(client.snapshot().padCooldowns.length, 6);
        assert.deepEqual(client.snapshot().arena, { id: 'large-rounded', skin: 'night' });
    } finally {
        server.dispose();
        client.dispose();
    }
});
