import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../shared/game/simulation';
import { GameSoundEvents, RoomSoundEvents } from '../frontend/game/soundEvents';
import type { RoomState } from '../shared/game/lobbyProtocol';

test('game audio ignores initial state, repeated snapshots and replayed predicted kicks', async () => {
    const simulation = await Simulation.create();
    try {
        const audio = new GameSoundEvents();
        const state = simulation.snapshot();
        assert.deepEqual(audio.update(state, 0, true, 0), []);
        const kicked = { ...state, kickSerial: 1 };
        assert.deepEqual(audio.update(kicked, 0, true, 100), ['soccer-kick']);
        assert.deepEqual(audio.update(kicked, 0, true, 200), []);
        assert.deepEqual(audio.update(state, 0, true, 300), []);
        assert.deepEqual(audio.update(kicked, 0, true, 400), []);
        assert.deepEqual(audio.update({ ...kicked, kickSerial: 2 }, 0, true, 500), ['soccer-kick']);
    } finally {
        simulation.dispose();
    }
});

test('game audio handles goals, resets, energy and throttled impacts', async () => {
    const simulation = await Simulation.create();
    try {
        const audio = new GameSoundEvents();
        const state = simulation.snapshot();
        audio.update(state, 0, true, 0);
        const goal = { ...state, score: [1, 0] as [number, number] };
        assert.deepEqual(audio.update(goal, 0, true, 100), ['goal-celebration']);
        assert.deepEqual(audio.update(goal, 0, true, 200), []);
        const reset = { ...goal, epoch: goal.epoch + 1 };
        assert.deepEqual(audio.update(reset, 0, true, 300), ['start']);
        const energy = { ...reset, energy: [35] };
        assert.deepEqual(audio.update(energy, 0, true, 400), ['booster']);
        const bounce = { ...energy, ballState: { ...energy.ballState, velocity: { x: 5, y: 0 } } };
        assert.deepEqual(audio.update(bounce, 0, true, 500), ['ball-bounce-1']);
        assert.deepEqual(audio.update(energy, 0, true, 550), []);
        assert.deepEqual(audio.update(bounce, 0, false, 800), []);
    } finally {
        simulation.dispose();
    }
});

test('joining or reconnecting to a running game does not replay historical events', async () => {
    const simulation = await Simulation.create();
    try {
        const audio = new GameSoundEvents();
        const state = simulation.snapshot();
        audio.update(state, 0, false, 0);
        const live = {
            ...state,
            epoch: state.epoch + 3,
            kickSerial: 20,
            score: [2, 1] as [number, number],
        };
        assert.deepEqual(audio.update(live, 0, true, 100), []);
        assert.deepEqual(audio.update(live, 0, false, 200), []);
        assert.deepEqual(audio.update({ ...live, kickSerial: 25 }, 0, true, 300), []);
        assert.deepEqual(audio.update({ ...live, kickSerial: 26 }, 0, true, 400), ['soccer-kick']);
    } finally {
        simulation.dispose();
    }
});

test('room audio does not replay chat history or match results on entry', () => {
    const audio = new RoomSoundEvents();
    const room: RoomState = {
        id: 'room',
        name: 'Room',
        hostId: 'self',
        running: false,
        locked: false,
        ready: true,
        arena: { id: 'classic', skin: 'grass' },
        members: [],
        match: {
            settings: { durationSeconds: 300, goalLimit: 5 },
            phase: 'waiting',
            remainingSeconds: 300,
            result: null,
        },
        messages: [{ id: 1, kind: 'chat', nick: 'other', text: 'hello', time: 0 }],
    };
    assert.deepEqual(audio.update(room, 'self'), ['ui-open']);
    assert.deepEqual(audio.update(room, 'self'), []);
    const running = { ...room, running: true, match: { ...room.match, phase: 'running' as const } };
    assert.deepEqual(audio.update(running, 'self'), ['start']);
    const chat = {
        ...running,
        messages: [
            ...room.messages,
            { id: 2, kind: 'chat' as const, nick: 'other', text: 'new', time: 1 },
        ],
    };
    assert.deepEqual(audio.update(chat, 'self'), ['message-notification-1']);
    assert.deepEqual(audio.update(chat, 'self'), []);
    const finished = {
        ...chat,
        running: false,
        match: { ...chat.match, phase: 'finished' as const },
    };
    assert.deepEqual(audio.update(finished, 'self'), ['end']);
    assert.deepEqual(audio.update(null, 'self'), ['ui-close']);
});
