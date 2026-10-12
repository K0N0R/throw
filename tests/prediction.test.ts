import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, RULES, type Input } from '../shared/game/simulation';
import { WorldPrediction } from '../shared/game/prediction';
import { NEUTRAL, type Command, type ServerState } from '../shared/game/protocol';

const frame = (game: Simulation, tick: number, ack = 0, input: Input = NEUTRAL): ServerState => ({
    type: 'state',
    tick,
    time: tick * RULES.timestep * 1000,
    ready: true,
    ack: [ack, 0],
    inputs: [input, NEUTRAL],
    game: game.snapshot(),
});
test('a moving player can push an idle player without crossing through them', async () => {
    const game = await Simulation.create(true);
    try {
        game.players[0].setTranslation({ x: 8, y: 3 }, true);
        game.players[1].setTranslation({ x: 10, y: 3 }, true);
        for (let i = 0; i < 120; i++) {
            game.step([{ x: 1, y: 0, shoot: false }, NEUTRAL]);
            const [a, b] = game.snapshot().players;
            assert.ok(b.x - a.x >= RULES.playerRadius * 2 - 0.02, 'Bodies must not overlap');
        }
        assert.ok(
            game.snapshot().players[1].x > 13,
            'Idle opponent should be pushed several units',
        );
    } finally {
        game.dispose();
    }
});
test('opposing movement produces a stable contact rather than crossing', async () => {
    const game = await Simulation.create(true);
    try {
        game.players[0].setTranslation({ x: 8, y: 3 }, true);
        game.players[1].setTranslation({ x: 10, y: 3 }, true);
        for (let i = 0; i < 120; i++)
            game.step([
                { x: 1, y: 0, shoot: false },
                { x: -1, y: 0, shoot: false },
            ]);
        const [a, b] = game.snapshot().players;
        assert.ok(b.x - a.x >= RULES.playerRadius * 2 - 0.02);
        assert.ok(Math.abs((a.x + b.x) / 2 - 9) < 0.1);
    } finally {
        game.dispose();
    }
});
test('ball keeps moving between updates after leaving the player instead of switching to an older timeline', async () => {
    const game = await Simulation.create(true);
    try {
        game.player.setTranslation({ x: 11, y: 6 }, true);
        game.players[1].setTranslation({ x: 18, y: 2 }, true);
        const prediction = new WorldPrediction(game);
        prediction.reconcile(frame(game, 0), 0, []);
        prediction.step({ x: 0, y: 0, shoot: true });
        let previous = prediction.snapshot().ball.x;
        for (let i = 0; i < 45; i++) {
            prediction.step(NEUTRAL);
            const x = prediction.snapshot().ball.x;
            assert.ok(
                x > previous,
                'Ball must advance on every physics tick, including after 350 ms',
            );
            assert.ok(x - previous < 0.25, 'No jump to a different timeline');
            previous = x;
        }
    } finally {
        game.dispose();
    }
});
for (const rtt of [0, 50, 100, 150])
    test(`predicted contact stays separated with ${rtt} ms RTT`, async () => {
        const server = await Simulation.create(true),
            client = await Simulation.create(true);
        try {
            server.players[0].setTranslation({ x: 8, y: 3 }, true);
            server.players[1].setTranslation({ x: 10, y: 3 }, true);
            const prediction = new WorldPrediction(client);
            prediction.reconcile(frame(server, 0), 0, []);
            const delay = Math.round(rtt / 2 / (RULES.timestep * 1000));
            let pending: Command[] = [];
            const sent: Command[] = [];
            const outgoing: { due: number; state: ServerState }[] = [];
            let ack = 0;
            for (let tick = 1; tick <= 120; tick++) {
                const command = { x: 1, y: 0, shoot: false, seq: tick };
                sent.push(command);
                pending.push(command);
                prediction.step(command);
                const consumed = sent[tick - delay - 1];
                if (consumed) ack = consumed.seq;
                server.step([consumed ?? NEUTRAL, NEUTRAL]);
                if (tick % 3 === 0)
                    outgoing.push({
                        due: tick + delay,
                        state: frame(server, tick, ack, consumed ?? NEUTRAL),
                    });
                while (outgoing[0]?.due <= tick) {
                    const state = outgoing.shift()!.state;
                    pending = pending.filter((c) => c.seq > state.ack[0]);
                    prediction.reconcile(state, 0, pending);
                }
                const view = prediction.snapshot();
                const [a, b] = view.players;
                assert.ok(
                    Math.hypot(a.x - b.x, a.y - b.y) >= RULES.playerRadius * 2 - 0.02,
                    `Rendered players overlap at tick ${tick}`,
                );
            }
            assert.ok(prediction.snapshot().players[1].x > 13);
        } finally {
            server.dispose();
            client.dispose();
        }
    });
for (const delay of [0, 3, 6, 9])
    test(`ball flight remains continuous with delayed 20 Hz snapshots (${(delay * 1000) / 60} ms one way)`, async () => {
        const server = await Simulation.create(true),
            client = await Simulation.create(true);
        try {
            server.player.setTranslation({ x: 11, y: 6 }, true);
            server.players[1].setTranslation({ x: 18, y: 2 }, true);
            const prediction = new WorldPrediction(client);
            prediction.reconcile(frame(server, 0), 0, []);
            let pending: Command[] = [];
            const outgoing: { due: number; state: ServerState }[] = [];
            let previous = prediction.snapshot().ball.x;
            for (let tick = 1; tick <= 45; tick++) {
                const command = { x: 0, y: 0, shoot: tick === 1, seq: tick };
                pending.push(command);
                server.step([command, NEUTRAL]);
                prediction.step(command);
                if (tick % 3 === 0)
                    outgoing.push({ due: tick + delay, state: frame(server, tick, tick, command) });
                while (outgoing[0]?.due <= tick) {
                    const state = outgoing.shift()!.state;
                    pending = pending.filter((c) => c.seq > state.ack[0]);
                    prediction.reconcile(state, 0, pending);
                }
                const x = prediction.snapshot().ball.x;
                assert.ok(
                    x > previous && x - previous < 0.25,
                    `Flight discontinuity at tick ${tick}: ${x - previous}`,
                );
                previous = x;
            }
        } finally {
            server.dispose();
            client.dispose();
        }
    });
test('an unconfirmed opponent shot is not invented by prediction', async () => {
    const game = await Simulation.create(true);
    try {
        game.player.setTranslation({ x: 8, y: 2 }, true);
        game.players[1].setTranslation({ x: 13, y: 6 }, true);
        const prediction = new WorldPrediction(game);
        const state = frame(game, 0);
        state.inputs[1] = { x: 0, y: 0, shoot: true };
        prediction.reconcile(state, 0, []);
        prediction.step(NEUTRAL);
        assert.equal(
            prediction.snapshot().ball.x,
            12,
            'Only confirmed remote shots may change ball velocity',
        );
    } finally {
        game.dispose();
    }
});
test('receiving a delayed opponent shot preserves the displayed ball position and catches up smoothly', async () => {
    const server = await Simulation.create(true),
        client = await Simulation.create(true);
    try {
        server.player.setTranslation({ x: 8, y: 2 }, true);
        server.players[1].setTranslation({ x: 13, y: 6 }, true);
        const prediction = new WorldPrediction(client);
        prediction.reconcile(frame(server, 0), 0, []);
        server.step([NEUTRAL, { x: 0, y: 0, shoot: true }]);
        for (let i = 0; i < 6; i++) {
            server.step([NEUTRAL, NEUTRAL]);
            prediction.step(NEUTRAL);
        }
        const before = prediction.snapshot().ball;
        prediction.reconcile(frame(server, 7), 0, []);
        const after = prediction.snapshot().ball;
        assert.ok(
            Math.hypot(after.x - before.x, after.y - before.y) < 0.001,
            'Snapshot receipt must not teleport the ball',
        );
        let previous = after.x;
        for (let i = 0; i < 6; i++) {
            prediction.step(NEUTRAL);
            const x = prediction.snapshot().ball.x;
            assert.ok(
                x < previous && previous - x < 0.6,
                'Correction must be spread across frames',
            );
            previous = x;
        }
    } finally {
        server.dispose();
        client.dispose();
    }
});
test('a remote reversal preserves presentation continuity even with a correction above the old snap threshold', async () => {
    const server = await Simulation.create(true),
        client = await Simulation.create(true);
    try {
        server.player.setTranslation({ x: 8, y: 2 }, true);
        server.players[1].setTranslation({ x: 16, y: 3 }, true);
        const prediction = new WorldPrediction(client);
        const state = frame(server, 0);
        state.inputs[1] = { x: 1, y: 0, shoot: false };
        prediction.reconcile(state, 0, []);
        for (let i = 0; i < 12; i++) prediction.step(NEUTRAL);
        const before = prediction.snapshot().players[1];
        server.players[1].setTranslation({ x: 15.5, y: 3 }, true);
        server.players[1].setLinvel({ x: -6, y: 0 }, true);
        const next = frame(server, 12);
        next.inputs[1] = { x: -1, y: 0, shoot: false };
        prediction.reconcile(next, 0, []);
        assert.ok(
            Math.abs(prediction.snapshot().players[1].x - before.x) < 0.001,
            'Reversal must not snap the remote player',
        );
    } finally {
        server.dispose();
        client.dispose();
    }
});
test('remote turns remain continuous under jitter and converge after input stops', async () => {
    const server = await Simulation.create(true),
        client = await Simulation.create(true);
    try {
        server.player.setTranslation({ x: 8, y: 8 }, true);
        server.players[1].setTranslation({ x: 16, y: 3 }, true);
        const prediction = new WorldPrediction(client);
        prediction.reconcile(frame(server, 0), 0, []);
        let pending: Command[] = [];
        const outgoing: { due: number; state: ServerState }[] = [];
        const jitter = [0, 3, 8, 2, 6, 1];
        let lastDue = 0;
        for (let tick = 1; tick <= 150; tick++) {
            const own = { ...NEUTRAL, seq: tick };
            pending.push(own);
            const remote =
                tick <= 90
                    ? { x: Math.floor(tick / 12) % 2 ? -1 : 1, y: 0, shoot: false }
                    : NEUTRAL;
            const beforeStep = prediction.snapshot().players[1];
            server.step([NEUTRAL, remote]);
            prediction.step(own);
            const moved = prediction.snapshot().players[1];
            assert.ok(
                Math.hypot(moved.x - beforeStep.x, moved.y - beforeStep.y) <=
                    RULES.speed * RULES.timestep * 2 + 0.01,
                'Per-frame movement must be bounded even during catch-up',
            );
            if (tick % 3 === 0) {
                const state = frame(server, tick, tick);
                state.inputs[1] = remote;
                lastDue = Math.max(lastDue + 1, tick + jitter[(tick / 3) % jitter.length]);
                outgoing.push({ due: lastDue, state });
            }
            while (outgoing[0]?.due <= tick) {
                const next = outgoing.shift()!.state;
                const before = prediction.snapshot().players[1];
                pending = pending.filter((c) => c.seq > next.ack[0]);
                prediction.reconcile(next, 0, pending);
                const after = prediction.snapshot().players[1];
                assert.ok(
                    Math.hypot(after.x - before.x, after.y - before.y) < 0.001,
                    'Jittered snapshots must not teleport the opponent',
                );
            }
        }
        assert.ok(
            Math.abs(prediction.snapshot().players[1].x - server.snapshot().players[1].x) < 0.05,
            'Smoothing must converge rather than leave a persistent visual offset',
        );
    } finally {
        server.dispose();
        client.dispose();
    }
});
test('goal prediction remains active, restores shooting and waits for authoritative kickoff', async () => {
    const server = await Simulation.create(true),
        client = await Simulation.create(true);
    try {
        server.ball.setTranslation({ x: 24.6, y: 6 }, true);
        server.step([NEUTRAL, NEUTRAL]);
        const prediction = new WorldPrediction(client);
        prediction.reconcile(frame(server, 1), 0, []);
        const epoch = server.snapshot().epoch;
        const beforeY = prediction.snapshot().player.y;
        for (let i = 0; i < 100; i++) prediction.step({ x: 0, y: -1, shoot: true });
        const state = prediction.snapshot();
        assert.ok(state.player.y < beforeY, 'Own movement must remain predicted after goal');
        assert.equal(state.players[0].shooting, true);
        assert.equal(
            state.epoch,
            epoch,
            'Client must not reset independently before server epoch arrives',
        );
        server.resetRound();
        prediction.reconcile(frame(server, 101), 0, []);
        assert.equal(prediction.snapshot().player.x, 10);
        assert.equal(prediction.snapshot().player.y, 6);
        assert.deepEqual(prediction.snapshot().players[0].velocity, { x: 0, y: 0 });
        assert.equal(prediction.snapshot().players[0].shooting, false);
    } finally {
        server.dispose();
        client.dispose();
    }
});
for (const right of [false, true])
    for (const floor of [false, true])
        test(`ball at ${right ? 'right' : 'left'} goal ${floor ? 'floor' : 'ceiling'} is not clamped back onto the pitch`, async () => {
            const server = await Simulation.create(true),
                client = await Simulation.create(true);
            try {
                const x = right ? RULES.width + 0.8 : -0.8;
                server.ball.setTranslation({ x, y: 6 }, true);
                server.step([NEUTRAL, NEUTRAL]);
                const prediction = new WorldPrediction(client);
                const ceiling = floor
                    ? (RULES.height + RULES.goalHeight) / 2 - RULES.ballRadius
                    : (RULES.height - RULES.goalHeight) / 2 + RULES.ballRadius;
                server.ball.setTranslation({ x, y: ceiling + (floor ? 0.005 : -0.005) }, true);
                prediction.reconcile(frame(server, 1), 0, []);
                const before = prediction.snapshot().ball;
                assert.ok(
                    Math.abs(before.x - x) < 0.01,
                    'Roof contact must keep the ball inside the goal',
                );
                server.ball.setTranslation({ x, y: ceiling + (floor ? 0.005 : -0.005) }, true);
                prediction.reconcile(frame(server, 2), 0, []);
                prediction.step(NEUTRAL);
                const after = prediction.snapshot().ball;
                assert.ok(
                    Math.abs(after.x - x) < 0.01,
                    'Tiny roof penetration must not teleport the ball across the goal line',
                );
                assert.ok(Math.hypot(after.x - before.x, after.y - before.y) < 0.03);
            } finally {
                server.dispose();
                client.dispose();
            }
        });
test('inactive slots do not block the ball or other players and survive snapshot restore', async () => {
    const server = await Simulation.create(4),
        client = await Simulation.create(4);
    try {
        server.setConnectedSeats([0, 3]);
        server.resetRound();
        assert.deepEqual(
            server.snapshot().players.map((p) => p.active),
            [true, false, false, true],
        );
        assert.equal(server.players[1].isEnabled(), false);
        assert.equal(server.players[2].isEnabled(), false);
        server.players[0].setTranslation({ x: 8, y: 2 }, true);
        server.players[3].setTranslation({ x: 18, y: 2 }, true);
        server.ball.setTranslation({ x: 9, y: 6 }, true);
        server.ball.setLinvel({ x: 6, y: 0 }, true);
        for (let i = 0; i < 20; i++) server.step([NEUTRAL, NEUTRAL, NEUTRAL, NEUTRAL]);
        assert.ok(
            server.ball.translation().x > 10.5,
            'Absent C at x=10 must not collide with the ball',
        );
        client.restore(server.snapshot());
        assert.deepEqual(
            client.snapshot().players.map((p) => p.active),
            [true, false, false, true],
        );
        assert.equal(client.players[1].isEnabled(), false);
        assert.equal(client.players[2].isEnabled(), false);
        const prediction = new WorldPrediction(client);
        const state = frame(server, 20);
        state.inputs = [NEUTRAL, NEUTRAL, NEUTRAL, NEUTRAL];
        state.ack = [0, 0, 0, 0];
        prediction.reconcile(state, 3, []);
        prediction.step({ x: 0, y: 1, shoot: true });
        assert.ok(prediction.snapshot().players[3].y > 2);
        assert.equal(prediction.snapshot().players[3].shooting, true);
    } finally {
        server.dispose();
        client.dispose();
    }
});
test('ten-player spawns fit the pitch and prediction keeps crowded players separated', async () => {
    const game = await Simulation.create(RULES.maxPlayers);
    try {
        const spawned = game.snapshot();
        assert.equal(spawned.players.length, 10);
        for (const player of spawned.players) {
            assert.ok(
                player.y >= RULES.playerRadius && player.y <= RULES.height - RULES.playerRadius,
            );
        }
        const inputs = spawned.players.map((player, seat) => ({
            x: seat % 2 === 0 ? 1 : -1,
            y: Math.sign(6 - player.y),
            shoot: false,
        }));
        const prediction = new WorldPrediction(game);
        const state = frame(game, 0);
        state.inputs = inputs;
        state.ack = inputs.map(() => 0);
        prediction.reconcile(state, 9, []);
        for (let tick = 0; tick < 120; tick++) {
            prediction.step(inputs[9]);
            const players = prediction.snapshot().players;
            for (let i = 0; i < players.length; i++)
                for (let j = i + 1; j < players.length; j++) {
                    const a = players[i],
                        b = players[j];
                    assert.ok(
                        Math.hypot(a.x - b.x, a.y - b.y) >= RULES.playerRadius * 2 - 0.02,
                        `Crowded players overlap: ${i}/${j}, tick ${tick}`,
                    );
                }
        }
    } finally {
        game.dispose();
    }
});
