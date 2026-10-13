import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { setTimeout as wait } from 'node:timers/promises';
import { WebSocket } from 'ws';
import { createGameServer } from '../backend/server';
import type { RoomState, LobbyMessage, LobbyRequest } from '../shared/game/lobbyProtocol';
import type { ServerState } from '../shared/game/protocol';

async function until(check: () => boolean) {
    const end = Date.now() + 5000;
    while (!check()) {
        assert.ok(Date.now() < end, 'Timed out');
        await wait(10);
    }
}
test('rooms isolate games/chat, enforce host actions and preserve running game on joins/leaves', async () => {
    const { server, match, lobby } = await createGameServer();
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `ws://127.0.0.1:${(server.address() as { port: number }).port}`;
    const sockets: WebSocket[] = [];
    type Peer = {
        socket: WebSocket;
        id: string;
        resumeToken: string;
        room?: RoomState | null;
        error: string;
        rooms: number;
    };
    const peer = async (nick: string, resumeToken = ''): Promise<Peer> => {
        const socket = new WebSocket(`${base}/lobby?resume=${encodeURIComponent(resumeToken)}`);
        sockets.push(socket);
        const p: Peer = { socket, id: '', resumeToken: '', error: '', rooms: 0 };
        socket.on('message', (raw) => {
            const m = JSON.parse(raw.toString()) as LobbyMessage;
            if (m.type === 'identity') {
                p.id = m.id;
                p.resumeToken = m.resumeToken;
            }
            if (m.type === 'room') p.room = m.room;
            if (m.type === 'error') p.error = m.message;
            if (m.type === 'rooms') p.rooms = m.rooms.length;
        });
        await once(socket, 'open');
        await until(() => !!p.id);
        socket.send(JSON.stringify({ type: 'hello', nick }));
        return p;
    };
    const send = (p: Peer, m: LobbyRequest) => p.socket.send(JSON.stringify(m));
    const game = async (p: Peer) => {
        const socket = new WebSocket(`${base}/game?room=${p.room!.id}&member=${p.resumeToken}`);
        sockets.push(socket);
        const g = {
            socket,
            seat: undefined as number | null | undefined,
            state: undefined as ServerState | undefined,
            seq: 0,
        };
        socket.on('message', (raw) => {
            const m = JSON.parse(raw.toString());
            if (m.type === 'welcome') g.seat = m.seat;
            if (m.type === 'state') g.state = m;
        });
        await until(() => g.seat !== undefined && !!g.state);
        return g;
    };
    try {
        const a = await peer('Ania'),
            b = await peer('Bartek'),
            c = await peer('Celina');
        send(a, { type: 'create', name: 'Pierwszy' });
        await until(() => !!a.room);
        const first = a.room!.id;
        send(b, { type: 'join', roomId: first });
        await until(() => !!b.room);
        const ga = await game(a),
            gb = await game(b);
        assert.equal(ga.seat, 0);
        assert.equal(gb.seat, 1);
        assert.equal(ga.state!.ready, false);
        send(c, { type: 'create', name: 'Drugi' });
        await until(() => !!c.room);
        const gc = await game(c);
        assert.equal(gc.seat, 0);
        assert.equal(gc.state!.ready, false);
        await until(() => a.rooms === 2);
        send(b, { type: 'start' });
        await until(() => !!b.error);
        assert.equal(a.room!.running, false);
        send(a, { type: 'chat', text: 'Tylko pierwszy pokój' });
        await until(() => b.room!.messages.some((m) => m.text === 'Tylko pierwszy pokój'));
        assert.ok(!c.room!.messages.some((m) => m.text === 'Tylko pierwszy pokój'));
        send(a, { type: 'start' });
        await until(() => ga.state!.ready && gb.state!.ready);
        assert.equal(c.room!.running, false);
        assert.equal(gc.state!.ready, false);
        const epoch = ga.state!.game.epoch;
        for (let i = 0; i < 8; i++) {
            ga.socket.send(
                JSON.stringify({
                    type: 'input',
                    epoch,
                    commands: [1, 2].map(() => ({ seq: ++ga.seq, x: 0, y: 1, shoot: false })),
                }),
            );
            await wait(34);
        }
        await until(() => ga.state!.game.players[0].y > 6.2);
        const d = await peer('Daniel');
        send(d, { type: 'join', roomId: first });
        await until(() => !!d.room);
        const gd = await game(d);
        assert.equal(gd.seat, 2);
        await until(() => ga.state!.game.players[2].active);
        assert.equal(ga.state!.game.epoch, epoch, 'Join must not reset running match');
        assert.ok(ga.state!.game.players[0].y > 6.2);
        send(d, { type: 'leave' });
        await until(() => d.room === null && !ga.state!.game.players[2].active);
        assert.equal(ga.state!.game.epoch, epoch, 'Leave must not reset running match');
        send(b, { type: 'team', team: 'spectator' });
        await until(() => b.room!.members.find((m) => m.id === b.id)?.seat === null);
        const observer = await game(b);
        assert.equal(observer.seat, null);
        send(b, { type: 'team', team: 'orange' });
        await until(() => b.room!.members.find((m) => m.id === b.id)?.seat === 1);
        const rejoined = await game(b);
        assert.equal(rejoined.seat, 1);
        const unauthorized = new WebSocket(`${base}/game?room=${first}&member=invalid`);
        sockets.push(unauthorized);
        const close = once(unauthorized, 'close');
        const unauthorizedOpen = once(unauthorized, 'open');
        const forgedRosterId = new WebSocket(`${base}/game?room=${first}&member=${a.id}`);
        sockets.push(forgedRosterId);
        const forgedClose = once(forgedRosterId, 'close');
        await once(forgedRosterId, 'open');
        assert.equal((await forgedClose)[0], 1008, 'Public roster ID is not a game credential');
        await unauthorizedOpen;
        assert.equal((await close)[0], 1008);
        // Reconnect reserves the host's seat but removes its body immediately.
        a.socket.close();
        await until(() => b.room!.members.find((m) => m.id === a.id)?.connected === false);
        await until(() => !rejoined.state!.game.players[0].active);
        assert.equal(b.room!.hostId, a.id);
        assert.equal(b.room!.running, true);
        assert.ok(!JSON.stringify(b.room).includes(a.resumeToken), 'Resume secret stays private');
        const resumed = await peer('Ania', a.resumeToken);
        await until(() => !!resumed.room);
        assert.equal(resumed.id, a.id);
        assert.equal(resumed.room!.hostId, a.id);
        assert.equal(resumed.room!.members.find((m) => m.id === a.id)!.seat, 0);
        assert.ok(resumed.room!.messages.some((m) => m.text === 'Tylko pierwszy pokój'));
        const resumedGame = await game(resumed);
        assert.equal(resumedGame.seat, 0);
        assert.equal(resumedGame.state!.game.epoch, epoch, 'Resume must not reset the match');
        const copiedSession = await peer('Nowa karta', a.resumeToken);
        assert.notEqual(copiedSession.id, resumed.id, 'Active session cannot be taken over');
        send(resumed, { type: 'leave' });
        await until(() => b.room!.hostId === b.id);
        send(b, { type: 'stop' });
        await until(() => !b.room!.running);
        assert.ok(b.room!.messages.some((m) => m.text.includes('Nowy gospodarz')));
        send(b, { type: 'leave' });
        await until(() => b.room === null);
        assert.equal(lobby.metrics().length, 1, 'Empty room must be disposed');
        c.socket.close();
        await wait(15500);
        assert.equal(lobby.metrics().length, 0, 'Expired disconnected member releases empty room');
    } finally {
        lobby.dispose();
        match.dispose();
        for (const socket of sockets) socket.terminate();
        await new Promise<void>((resolve) => server.close(() => resolve()));
    }
});
