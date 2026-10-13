import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { setTimeout as wait } from 'node:timers/promises';
import { WebSocket } from 'ws';
import { createGameServer } from '../backend/server';
import type { RoomState, RoomInfo, LobbyRequest, LobbyMessage } from '../shared/game/lobbyProtocol';
import type { ServerState } from '../shared/game/protocol';

async function until(check: () => boolean) {
    const end = Date.now() + 5000;
    while (!check()) {
        assert.ok(Date.now() < end, 'Timed out');
        await wait(10);
    }
}
test('room passwords, host moderation, team capacity and transfer are enforced by server', async () => {
    const { server, match, lobby } = await createGameServer();
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `ws://127.0.0.1:${(server.address() as { port: number }).port}`;
    const sockets: WebSocket[] = [];
    type Peer = {
        socket: WebSocket;
        id: string;
        token: string;
        room?: RoomState | null;
        rooms: RoomInfo[];
        error: string;
    };
    const peer = async (nick: string, token = '', avatar = '🐻') => {
        const socket = new WebSocket(`${base}/lobby?resume=${token}`);
        sockets.push(socket);
        const p: Peer = { socket, id: '', token: '', rooms: [], error: '' };
        socket.on('message', (raw) => {
            const m = JSON.parse(raw.toString()) as LobbyMessage;
            if (m.type === 'identity') {
                p.id = m.id;
                p.token = m.resumeToken;
            }
            if (m.type === 'room') p.room = m.room;
            if (m.type === 'rooms') p.rooms = m.rooms;
            if (m.type === 'error') p.error = m.message;
        });
        await once(socket, 'open');
        await until(() => !!p.id);
        socket.send(JSON.stringify({ type: 'hello', nick, avatar }));
        return p;
    };
    const send = (p: Peer, m: LobbyRequest) => p.socket.send(JSON.stringify(m));
    const error = async (p: Peer, m: LobbyRequest, text: string) => {
        p.error = '';
        send(p, m);
        await until(() => p.error.includes(text));
    };
    const game = async (p: Peer) => {
        const socket = new WebSocket(`${base}/game?room=${p.room!.id}&member=${p.token}`);
        sockets.push(socket);
        const g = { socket, state: undefined as ServerState | undefined };
        socket.on('message', (raw) => {
            const m = JSON.parse(raw.toString());
            if (m.type === 'state') g.state = m;
        });
        await until(() => !!g.state);
        return g;
    };
    try {
        const a = await peer('Ania', '', '👮🏻'),
            b = await peer('Bartek', '', '👨‍👩‍👧‍👦'),
            c = await peer('Celina');
        send(a, { type: 'create', name: 'Prywatny', password: 'testowe-haslo' });
        await until(() => !!a.room);
        const roomId = a.room!.id;
        assert.equal(a.room!.locked, true);
        await until(() => b.rooms.some((r) => r.id === roomId && r.locked));
        assert.ok(!JSON.stringify(b.rooms).includes('testowe-haslo'));
        assert.ok(!JSON.stringify(a.room).includes('testowe-haslo'));
        await error(b, { type: 'join', roomId }, 'Nieprawidłowe');
        assert.equal(b.room, null);
        await error(b, { type: 'join', roomId, password: 'testowe-haslo' }, 'sekundę');
        await wait(1050);
        send(b, { type: 'join', roomId, password: 'testowe-haslo' });
        await until(() => !!b.room);
        for (const action of [
            { type: 'move', memberId: a.id, team: 'spectator' },
            { type: 'transfer', memberId: b.id },
            { type: 'kick', memberId: a.id },
            { type: 'access', password: '' },
            { type: 'arena', arena: { id: 'large-rounded', skin: 'night' } },
        ] as LobbyRequest[])
            await error(b, action, 'Tylko gospodarz');
        send(c, { type: 'create', name: 'Inny' });
        await until(() => !!c.room);
        await error(a, { type: 'kick', memberId: c.id }, 'nie jest już');
        assert.equal(a.room!.members.find((m) => m.id === a.id)!.avatar, '👮🏻');
        assert.equal(b.room!.members.find((m) => m.id === b.id)!.avatar, '👨‍👩‍👧‍👦');
        await error(a, { type: 'hello', nick: 'Broken', avatar: '🐻🐻' }, 'jednym emoji');
        assert.equal(a.room!.members.find((m) => m.id === a.id)!.nick, 'Ania');
        assert.equal(a.room!.members.find((m) => m.id === a.id)!.avatar, '👮🏻');
        await error(
            a,
            { type: 'arena', arena: { id: 'invalid', skin: 'grass' } as never },
            'Nieprawidłowe boisko',
        );
        send(a, { type: 'arena', arena: { id: 'large-rounded', skin: 'night' } });
        await until(() => a.room!.arena.id === 'large-rounded' && b.room!.arena.skin === 'night');
        assert.equal(c.room!.arena.id, 'classic', 'Arena choice is isolated per room');
        const ga = await game(a),
            gb = await game(b);
        send(a, { type: 'start' });
        await until(() => ga.state!.ready);
        const epoch = ga.state!.game.epoch;
        assert.deepEqual(ga.state!.game.arena, { id: 'large-rounded', skin: 'night' });
        await error(a, { type: 'arena', arena: { id: 'classic', skin: 'grass' } }, 'przed meczem');
        assert.equal(ga.state!.game.arena.id, 'large-rounded');
        send(b, { type: 'chat', text: 'Avatar w chacie' });
        await until(() =>
            a.room!.messages.some((m) => m.text === 'Avatar w chacie' && m.avatar === '👨‍👩‍👧‍👦'),
        );
        send(b, { type: 'hello', nick: 'Bartek', avatar: '🔥' });
        await until(() => a.room!.members.find((m) => m.id === b.id)?.avatar === '🔥');
        assert.equal(ga.state!.game.epoch, epoch, 'Changing avatar does not reset the game');
        send(a, { type: 'move', memberId: b.id, team: 'spectator' });
        await until(() => b.room!.members.find((m) => m.id === b.id)?.seat === null);
        await until(() => !ga.state!.game.players[1].active);
        assert.equal(ga.state!.game.epoch, epoch);
        assert.equal(a.room!.running, true);
        send(a, { type: 'move', memberId: b.id, team: 'orange' });
        await until(() => b.room!.members.find((m) => m.id === b.id)?.seat === 1);
        const gb2 = await game(b);
        await until(() => gb2.state!.ready);
        send(a, { type: 'transfer', memberId: b.id });
        await until(() => a.room!.hostId === b.id);
        await until(() => ga.state!.hostSeat === 1);
        await error(a, { type: 'stop' }, 'Tylko gospodarz');
        await error(
            b,
            { type: 'move', memberId: a.id, team: 'invalid' as never },
            'Nieprawidłowa drużyna',
        );
        send(b, { type: 'access', password: 'nowe-haslo' });
        await until(() => a.room!.messages.some((m) => m.text.includes('zabezpieczył')));
        // Existing membership resumes without resending the changed room password.
        a.socket.close();
        await until(() => b.room!.members.find((m) => m.id === a.id)?.connected === false);
        const resumed = await peer('Ania', a.token, '👮🏻');
        await until(() => !!resumed.room);
        assert.equal(resumed.id, a.id);
        assert.equal(resumed.room!.members.find((m) => m.id === a.id)!.avatar, '👮🏻');
        assert.equal(resumed.room!.running, true);
        const ga2 = await game(resumed);
        assert.equal(ga2.state!.game.epoch, epoch);
        await error(b, { type: 'kick', memberId: b.id }, 'Wyjdź do lobby');
        send(b, { type: 'kick', memberId: resumed.id });
        await until(() => resumed.room === null && resumed.error.includes('wyrzucił'));
        await until(() => !gb2.state!.game.players[0].active);
        assert.equal(gb2.state!.game.epoch, epoch);
        await error(resumed, { type: 'join', roomId, password: 'nowe-haslo' }, '30 sekundach');
        send(b, { type: 'stop' });
        await until(() => !b.room!.running);
        send(b, { type: 'access', password: '' });
        await until(() => !b.room!.locked);
        // Fill orange team, then verify a host move cannot overbook it.
        const guests: Peer[] = [];
        for (let i = 0; i < 9; i++) {
            const p = await peer(`Gracz ${i}`);
            send(p, { type: 'join', roomId });
            await until(() => !!p.room);
            guests.push(p);
        }
        const blue = guests.find(
            (p) => p.room!.members.find((m) => m.id === p.id)!.seat! % 2 === 0,
        )!;
        assert.equal(b.room!.members.filter((m) => m.seat !== null && m.seat % 2 === 1).length, 5);
        await error(b, { type: 'move', memberId: blue.id, team: 'orange' }, 'pięciu');
        assert.equal(blue.room!.members.find((m) => m.id === blue.id)!.seat! % 2, 0);
        send(b, { type: 'move', memberId: blue.id, team: 'spectator' });
        await until(() => blue.room!.members.find((m) => m.id === blue.id)?.seat === null);
        // Room stays intact and manual transfer remains possible during waiting.
        send(b, { type: 'transfer', memberId: blue.id });
        await until(() => blue.room!.hostId === blue.id);
        assert.equal(blue.room!.members.find((m) => m.id === blue.id)!.seat, null);
        assert.ok(gb.socket.readyState !== WebSocket.OPEN);
    } finally {
        lobby.dispose();
        match.dispose();
        for (const socket of sockets) socket.terminate();
        await new Promise<void>((resolve) => server.close(() => resolve()));
    }
});
