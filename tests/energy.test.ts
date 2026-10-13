import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, RULES } from '../shared/game/simulation';
import { ENERGY_PADS, ENERGY_RULES } from '../shared/game/energy';
import { validCommand } from '../shared/game/protocol';
import { WorldPrediction } from '../shared/game/prediction';
import type { ServerState, Command } from '../shared/game/protocol';
const idle = { x: 0, y: 0, shoot: false };

test('pads fill energy once, respawn, cap at 100 and do not disappear for a full player', async () => {
    const game = await Simulation.create();
    try {
        game.player.setTranslation(ENERGY_PADS[0], true);
        game.step(idle);
        assert.equal(game.snapshot().energy[0], 35);
        assert.equal(game.snapshot().padCooldowns[0], 8);
        game.step(idle);
        assert.equal(game.snapshot().energy[0], 35);
        for (let i = 0; i < 3 * 8 * 60; i++) game.step(idle);
        assert.equal(game.snapshot().energy[0], 100);
        for (let i = 0; i < 8 * 60 + 1; i++) game.step(idle);
        assert.equal(game.snapshot().padCooldowns[0], 0);
    } finally {
        game.dispose();
    }
});
test('boost requires energy and moving input; shooting keeps original speed without draining', async () => {
    const game = await Simulation.create();
    try {
        game.player.setTranslation({ x: 5, y: 6 }, true);
        for (let i = 0; i < 30; i++) game.step({ x: 1, y: 0, shoot: false, boost: true });
        assert.ok(Math.abs(game.player.linvel().x - RULES.speed) < 0.01);
        const snapshot = game.snapshot();
        snapshot.energy[0] = 100;
        game.restore(snapshot);
        game.step({ ...idle, boost: true });
        assert.equal(game.snapshot().energy[0], 100);
        for (let i = 0; i < 30; i++) game.step({ x: 1, y: 0, shoot: true, boost: true });
        assert.equal(game.snapshot().energy[0], 100);
        assert.ok(Math.abs(game.player.linvel().x - RULES.shootingSpeed) < 0.01);
        for (let i = 0; i < 30; i++) game.step({ x: 1, y: 0, shoot: false, boost: true });
        assert.ok(Math.abs(game.player.linvel().x - ENERGY_RULES.speed) < 0.01);
        assert.ok(Math.abs(game.snapshot().energy[0] - 87.5) < 0.001);
        assert.equal(game.snapshot().boosting[0], true);
        game.step({ x: 1, y: 0, shoot: false, boost: false });
        assert.equal(game.snapshot().boosting[0], false);
    } finally {
        game.dispose();
    }
});
test('inactive seats cannot collect, contested pad is awarded once, kickoff clears boost state', async () => {
    const game = await Simulation.create(2);
    try {
        game.setConnectedSeats([1]);
        game.players[0].setTranslation(ENERGY_PADS[0], true);
        game.step([idle, idle]);
        assert.equal(game.snapshot().energy[0], 0);
        assert.equal(game.snapshot().padCooldowns[0], 0);
        game.setConnectedSeats([0, 1]);
        game.players[0].setTranslation({ x: 4 - 0.5, y: 2 }, true);
        game.players[1].setTranslation({ x: 4 + 0.5, y: 2 }, true);
        game.step([idle, idle]);
        assert.equal(
            game.snapshot().energy.reduce((a, b) => a + b),
            35,
        );
        game.resetRound();
        assert.deepEqual(game.snapshot().energy, [0, 0]);
        assert.deepEqual(game.snapshot().boosting, [false, false]);
        assert.ok(game.snapshot().padCooldowns.every((value) => value === 0));
        const old = game.snapshot();
        delete (old as Partial<typeof old>).energy;
        delete (old as Partial<typeof old>).boosting;
        delete (old as Partial<typeof old>).padCooldowns;
        game.restore(old);
        assert.deepEqual(game.snapshot().energy, [0, 0]);
    } finally {
        game.dispose();
    }
});
test('boost protocol rejects forged values and energy is exhausted without becoming negative', async () => {
    assert.equal(validCommand({ seq: 1, ...idle, boost: 'yes' }), false);
    assert.equal(validCommand({ seq: 1, ...idle, boost: true }), true);
    assert.equal(validCommand({ seq: 1, ...idle }), true);
    const game = await Simulation.create();
    try {
        game.player.setTranslation({ x: 5, y: 4 }, true);
        const state = game.snapshot();
        state.energy[0] = 1;
        game.restore(state);
        for (let i = 0; i < 60; i++) game.step({ x: 1, y: 0, shoot: false, boost: true });
        assert.equal(game.snapshot().energy[0], 0);
        assert.equal(game.snapshot().boosting[0], false);
        assert.ok(Math.abs(game.player.linvel().x - RULES.speed) < 0.01);
    } finally {
        game.dispose();
    }
});
for (const delay of [0, 3, 9])
    test(`boost and pickup prediction reconciles with ${delay * RULES.timestep * 1000} ms delayed snapshots`, async () => {
        const server = await Simulation.create(2),
            client = await Simulation.create(2);
        try {
            server.players[0].setTranslation({ x: 2.8, y: 2 }, true);
            const prediction = new WorldPrediction(client);
            let tick = 0,
                seq = 0;
            const snapshot = (): ServerState => ({
                type: 'state',
                tick,
                time: tick * RULES.timestep * 1000,
                ready: true,
                ack: [seq, 0],
                inputs: [{ x: 1, y: 0, shoot: false, boost: true }, idle],
                game: server.snapshot(),
            });
            prediction.reconcile(snapshot(), 0, []);
            const queue: { deliver: number; state: ServerState }[] = [];
            let pending: Command[] = [];
            for (tick = 1; tick <= 90; tick++) {
                const command = { seq: ++seq, x: 1, y: 0, shoot: false, boost: true };
                pending.push(command);
                prediction.step(command);
                server.step([command, idle]);
                if (tick % 3 === 0) queue.push({ deliver: tick + delay, state: snapshot() });
                while (queue[0]?.deliver <= tick) {
                    const message = queue.shift()!.state;
                    pending = pending.filter((c) => c.seq > message.ack[0]);
                    prediction.reconcile(message, 0, pending);
                }
                assert.ok(client.snapshot().energy[0] >= 0 && client.snapshot().energy[0] <= 100);
            }
            prediction.reconcile(snapshot(), 0, []);
            assert.ok(Math.abs(client.snapshot().energy[0] - server.snapshot().energy[0]) < 0.0001);
            assert.ok(
                Math.abs(client.players[0].translation().x - server.players[0].translation().x) <
                    0.001,
            );
            assert.ok(server.snapshot().padCooldowns[0] > 0, 'Path collects an energy pad');
        } finally {
            server.dispose();
            client.dispose();
        }
    });
