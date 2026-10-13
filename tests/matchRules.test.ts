import { Simulation, RULES } from '../shared/game/simulation';
import test from 'node:test';
import assert from 'node:assert/strict';
import { MatchFlow, validMatchSettings } from '../shared/game/matchRules';

test('settings require at least one bounded integer limit', () => {
    for (const value of [
        { durationSeconds: 0, goalLimit: 0 },
        { durationSeconds: 9, goalLimit: 5 },
        { durationSeconds: NaN, goalLimit: 5 },
        { durationSeconds: 10, goalLimit: 51 },
        { durationSeconds: 10, goalLimit: 1.2 },
    ])
        assert.equal(validMatchSettings(value), false);
    assert.ok(validMatchSettings({ durationSeconds: 0, goalLimit: 1 }));
    assert.ok(validMatchSettings({ durationSeconds: 10, goalLimit: 0 }));
});
test('time ends match once, records draw and rematch clears result and clock', () => {
    const flow = new MatchFlow();
    flow.configure({ durationSeconds: 10, goalLimit: 0 });
    flow.start();
    assert.equal(flow.configure({ durationSeconds: 20, goalLimit: 2 }), false);
    assert.equal(flow.step(9, [2, 2], false), false);
    assert.equal(flow.snapshot().remainingSeconds, 1);
    assert.equal(flow.step(1, [2, 2], false), true);
    assert.deepEqual(flow.snapshot().result, { score: [2, 2], winner: 'draw', reason: 'time' });
    assert.equal(flow.step(1, [3, 2], false), false);
    flow.start();
    assert.equal(flow.snapshot().result, null);
    assert.equal(flow.snapshot().remainingSeconds, 10);
});
test('decisive goal keeps free play then freezes the authoritative result', () => {
    const flow = new MatchFlow();
    flow.configure({ durationSeconds: 0, goalLimit: 3 });
    flow.start();
    assert.equal(flow.step(1, [2, 2], false), false);
    assert.equal(flow.step(1, [2, 3], true), false);
    assert.equal(flow.step(1, [2, 3], true), false);
    assert.equal(flow.step(0.31, [2, 3], true), true);
    assert.deepEqual(flow.snapshot().result, { score: [2, 3], winner: 'orange', reason: 'goals' });
});
test('time winner, goal precedence and manual stop are explicit', () => {
    const flow = new MatchFlow();
    flow.configure({ durationSeconds: 10, goalLimit: 2 });
    flow.start();
    flow.step(10, [2, 1], true);
    flow.step(1.31, [2, 1], true);
    assert.equal(flow.snapshot().result!.reason, 'goals');
    flow.stop();
    assert.equal(flow.snapshot().phase, 'waiting');
    assert.equal(flow.snapshot().result, null);
    flow.start();
    flow.step(10, [0, 1], false);
    assert.equal(flow.snapshot().result!.winner, 'orange');
    assert.equal(flow.snapshot().result!.reason, 'time');
});

test('final goal preserves moving world until result without an automatic kickoff', async () => {
    const game = await Simulation.create();
    const flow = new MatchFlow();
    flow.configure({ durationSeconds: 0, goalLimit: 1 });
    flow.start();
    game.ball.setTranslation({ x: 24.5, y: 6 }, true);
    const epoch = game.snapshot().epoch;
    let finished = false;
    let steps = 0;
    try {
        while (!finished && steps < 100) {
            game.step({ x: 0, y: 1, shoot: false }, true, undefined, flow.canKickoff);
            const snapshot = game.snapshot();
            finished = flow.step(RULES.timestep, snapshot.score, snapshot.phase === 'goal');
            steps++;
        }
        assert.ok(finished);
        assert.ok(steps >= 78);
        assert.equal(game.snapshot().epoch, epoch, 'No kickoff before final result');
        assert.ok(game.player.translation().y > 6.5, 'Player can keep moving after deciding goal');
        assert.deepEqual(game.snapshot().score, [1, 0]);
        game.resetMatch();
        flow.start();
        assert.deepEqual(game.snapshot().score, [0, 0]);
        assert.ok(game.snapshot().epoch > epoch);
    } finally {
        game.dispose();
    }
});
