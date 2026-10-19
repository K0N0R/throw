import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, RULES, projectKickoffPlayer, type Input } from '../shared/game/simulation';

const idle: Input = { x: 0, y: 0, shoot: false };
const advance = (game: Simulation, steps: number, input = idle) => {
    for (let i = 0; i < steps; i++) game.step(input);
};
const scenario = (name: string, run: (game: Simulation) => void) =>
    test(name, async () => {
        const game = await Simulation.create();
        try {
            run(game);
        } finally {
            game.dispose();
        }
    });

scenario('movement normalizes diagonal input and stops after release', (game) => {
    advance(game, 30, { x: 1, y: 1, shoot: false });
    const v = game.player.linvel();
    assert.ok(Math.abs(Math.hypot(v.x, v.y) - RULES.speed) < 0.01);
    advance(game, 30);
    assert.ok(Math.hypot(game.player.linvel().x, game.player.linvel().y) < 0.001);
});
scenario('holding shoot slows the player', (game) => {
    advance(game, 20, { x: -1, y: 0, shoot: true });
    assert.ok(Math.abs(game.player.linvel().x + RULES.shootingSpeed) < 0.01);
});
scenario('kick requires proximity and has a cooldown', (game) => {
    game.step({ ...idle, shoot: true });
    assert.equal(game.ball.linvel().x, 0);
    game.player.setTranslation({ x: 11, y: 6 }, true);
    game.step({ ...idle, shoot: true });
    assert.ok(game.ball.linvel().x > 13);
    assert.equal(game.snapshot().kickReady, false);
    advance(game, 20);
    assert.equal(game.snapshot().kickReady, true);
});
scenario('ball bounces off the top wall even at high velocity', (game) => {
    game.ball.setTranslation({ x: 12, y: 1 }, true);
    game.ball.setLinvel({ x: 0, y: -100 }, true);
    advance(game, 3);
    assert.ok(game.ball.translation().y >= RULES.ballRadius - 0.02);
    assert.ok(game.ball.linvel().y > 0);
    assert.deepEqual(game.snapshot().score, [0, 0]);
});
scenario('player cannot enter the goal', (game) => {
    game.player.setTranslation({ x: 1, y: 6 }, true);
    advance(game, 120, { x: -1, y: 0, shoot: false });
    assert.ok(game.player.translation().x >= RULES.playerRadius - 0.02);
});
for (const right of [false, true])
    scenario(`goal at ${right ? 'right' : 'left'} scores once and resets automatically`, (game) => {
        game.ball.setTranslation({ x: right ? RULES.width - 0.5 : 0.5, y: 6 }, true);
        game.ball.setLinvel({ x: right ? 14 : -14, y: 0 }, true);
        advance(game, 8);
        const score = right ? [1, 0] : [0, 1];
        assert.deepEqual(game.snapshot().score, score);
        assert.equal(game.snapshot().phase, 'goal');
        advance(game, 30, { x: 1, y: 0, shoot: true });
        assert.deepEqual(game.snapshot().score, score);
        advance(game, 90);
        assert.equal(game.snapshot().phase, 'playing');
        assert.equal(game.snapshot().ball.x, RULES.width / 2);
        assert.deepEqual(game.snapshot().score, score);
        game.resetRound();
        assert.deepEqual(game.snapshot().score, score);
        game.resetMatch();
        assert.deepEqual(game.snapshot().score, [0, 0]);
        assert.equal(game.player.linvel().x, 0);
        assert.equal(game.ball.linvel().x, 0);
    });
scenario('ball outside goal mouth hits side wall instead of scoring', (game) => {
    game.ball.setTranslation({ x: 23, y: 2 }, true);
    game.ball.setLinvel({ x: 20, y: 0 }, true);
    advance(game, 15);
    assert.deepEqual(game.snapshot().score, [0, 0]);
    assert.ok(game.ball.linvel().x < 0);
});
scenario(
    'goal window keeps movement, physics and kicks active without counting more goals',
    (game) => {
        game.ball.setTranslation({ x: 24.6, y: 6 }, true);
        game.step(idle);
        assert.equal(game.snapshot().phase, 'goal');
        const epoch = game.snapshot().epoch;
        const score = game.snapshot().score;
        const playerY = game.player.translation().y;
        const ballX = game.ball.translation().x;
        game.ball.setLinvel({ x: -4, y: 0 }, true);
        advance(game, 8, { x: 0, y: -1, shoot: false });
        assert.ok(game.player.translation().y < playerY, 'Player must move after goal');
        assert.ok(game.ball.translation().x < ballX, 'Ball must continue moving after goal');
        game.player.setTranslation({ x: 11, y: 4 }, true);
        game.player.setLinvel({ x: 0, y: 0 }, true);
        game.ball.setTranslation({ x: 12, y: 4 }, true);
        game.ball.setLinvel({ x: 0, y: 0 }, true);
        game.step({ x: 0, y: 0, shoot: true });
        assert.ok(game.ball.linvel().x > 13, 'Rage kick must work during goal window');
        assert.equal(game.snapshot().players[0].shooting, true);
        // Crossing either goal again must not add points or restart the countdown.
        for (const x of [-0.6, 24.6]) {
            game.ball.setTranslation({ x, y: 6 }, true);
            game.step(idle);
            assert.deepEqual(game.snapshot().score, score);
            assert.equal(game.snapshot().epoch, epoch);
        }
    },
);
scenario('automatic kickoff clears velocity, forces, cooldowns and old shooting state', (game) => {
    game.ball.setTranslation({ x: 24.6, y: 6 }, true);
    game.step(idle);
    const epoch = game.snapshot().epoch;
    while (game.snapshot().pause > RULES.timestep * 1.5) game.step({ x: 0, y: -1, shoot: true });
    for (const body of [...game.players, game.ball]) {
        body.setLinvel({ x: 4, y: 3 }, true);
        body.addForce({ x: 50, y: 20 }, true);
    }
    while (game.snapshot().epoch === epoch) game.step({ x: 1, y: 0, shoot: true });
    const state = game.snapshot();
    assert.equal(state.phase, 'playing');
    assert.equal(state.ball.x, 12);
    assert.ok(
        Math.abs(state.player.x - (12 - RULES.centerCircleRadius - RULES.playerRadius)) < 0.001,
    );
    assert.equal(state.player.y, 6);
    assert.equal(state.ball.y, 6);
    assert.deepEqual(state.cooldowns, [0]);
    assert.equal(state.players[0].shooting, false);
    for (const body of [...game.players, game.ball]) {
        assert.deepEqual({ ...body.linvel() }, { x: 0, y: 0 });
        assert.deepEqual({ ...body.userForce() }, { x: 0, y: 0 });
        assert.equal(body.angvel(), 0);
        assert.equal(body.userTorque(), 0);
    }
});
scenario('shooting indicator follows the key rather than kick range or cooldown', (game) => {
    game.step({ ...idle, shoot: true });
    assert.equal(game.snapshot().players[0].shooting, true);
    assert.equal(game.snapshot().kickSerial, 0, 'No nearby ball is required for the indicator');
    game.step(idle);
    assert.equal(game.snapshot().players[0].shooting, false);
    game.step({ ...idle, shoot: true });
    assert.equal(game.snapshot().players[0].shooting, true);
});

for (const scoringSeat of [0, 1]) {
    test(`restarting team ${scoringSeat} can enter the circle but cannot cross midfield`, async () => {
        const game = await Simulation.create(true);
        try {
            const team = scoringSeat === 0 ? 'left' : 'right';
            const side = scoringSeat === 0 ? -1 : 1;
            game.resetRound(team);
            const projected = projectKickoffPlayer(
                { x: 12 - side, y: 6 },
                scoringSeat,
                team,
                game.arena,
            );
            assert.equal(projected.x, 12 + side * RULES.playerRadius);
            assert.ok(Math.hypot(projected.x - 12, projected.y - 6) < RULES.centerCircleRadius);
            game.players[scoringSeat].setTranslation({ x: 12 + side, y: 2 }, true);
            for (let tick = 0; tick < 120; tick++) {
                game.step(
                    game.players.map((_, seat) => ({
                        ...idle,
                        x: seat === scoringSeat ? -side : 0,
                    })),
                );
                assert.ok(
                    side * (game.players[scoringSeat].translation().x - 12) >=
                        RULES.playerRadius - 0.001,
                );
                assert.equal(game.snapshot().kickoffTeam, team);
            }
        } finally {
            game.dispose();
        }
    });
    test(`team ${scoringSeat} releases kickoff restrictions by touching without shooting`, async () => {
        const game = await Simulation.create(4);
        try {
            const team = scoringSeat === 0 ? 'left' : 'right';
            const side = scoringSeat === 0 ? -1 : 1;
            game.resetRound(team);
            const opponent = game.players[1 - scoringSeat];
            opponent.setTranslation({ x: 12 - side * 3, y: 6 }, true);
            game.ball.setTranslation({ x: 12 - side * 2.22, y: 6 }, true);
            game.step(idle);
            assert.equal(
                game.snapshot().kickoffTeam,
                team,
                'Wrong team cannot release the restriction',
            );
            game.resetRound(team);
            const teammate = game.players[scoringSeat + 2];
            teammate.setTranslation({ x: 12 + side * 0.9, y: 6 }, true);
            game.step(idle);
            assert.equal(
                game.snapshot().kickoffTeam,
                team,
                'Approaching without touching must not release it',
            );
            teammate.setTranslation({ x: 12 + side * 0.79, y: 6 }, true);
            game.step(idle);
            assert.equal(
                game.snapshot().kickoffTeam,
                null,
                'Any teammate may touch the ball to restart',
            );
            assert.equal(game.snapshot().kickSerial, 0, 'No kick is required');
            game.resetRound(team);
            for (let tick = 0; tick < 90 && game.snapshot().kickoffTeam !== null; tick++)
                game.step(
                    game.players.map((_, seat) => ({
                        x: seat === scoringSeat ? -side : 0,
                        y: seat === scoringSeat ? 0.8 : 0,
                        shoot: false,
                    })),
                );
            assert.equal(
                game.snapshot().kickoffTeam,
                null,
                'Walking into the ball must release the restriction',
            );
            assert.equal(game.snapshot().kickSerial, 0);
        } finally {
            game.dispose();
        }
    });
    test(`only conceding team can restart after team ${scoringSeat} scores`, async () => {
        const game = await Simulation.create(10);
        try {
            const right = scoringSeat === 0;
            game.ball.setTranslation({ x: right ? 24.6 : -0.6, y: 6 }, true);
            game.step(idle);
            const epoch = game.snapshot().epoch;
            while (game.snapshot().epoch === epoch) game.step(idle);
            const team = right ? 'right' : 'left';
            assert.equal(game.snapshot().kickoffTeam, team);
            for (let step = 0; step < 180; step++) {
                game.step(
                    game.players.map((_, seat) => ({
                        x: seat % 2 === scoringSeat ? (right ? 1 : -1) : 0,
                        y: 0,
                        shoot: seat % 2 === scoringSeat,
                        boost: true,
                    })),
                );
                game.snapshot().players.forEach((player, seat) => {
                    assert.ok(
                        seat % 2 === 0
                            ? player.x <= 12 - RULES.playerRadius + 0.001
                            : player.x >= 12 + RULES.playerRadius - 0.001,
                    );
                    if (seat % 2 !== scoringSeat) return;
                    assert.ok(
                        Math.hypot(player.x - 12, player.y - 6) >=
                            RULES.centerCircleRadius + RULES.playerRadius - 0.001,
                    );
                });
            }
            assert.equal(game.snapshot().kickSerial, 0);
            assert.equal(game.snapshot().kickoffTeam, team);
            const restartingSeat = 1 - scoringSeat;
            const restartingPlayer = game.players[restartingSeat];
            restartingPlayer.setTranslation({ x: right ? 13 : 11, y: 6 }, true);
            game.step(game.players.map((_, seat) => ({ ...idle, shoot: seat === restartingSeat })));
            assert.equal(game.snapshot().kickoffTeam, null);
            assert.equal(game.snapshot().kickSerial, 1);
            const opponent = game.players[scoringSeat];
            opponent.setTranslation({ x: right ? 13 : 11, y: 4 }, true);
            game.step(idle);
            assert.ok(right ? opponent.translation().x > 12 : opponent.translation().x < 12);
            game.resetMatch();
            assert.equal(game.snapshot().kickoffTeam, null);
        } finally {
            game.dispose();
        }
    });
}
