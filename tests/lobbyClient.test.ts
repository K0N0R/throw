import test from 'node:test';
import assert from 'node:assert/strict';
import { LobbyClient } from '../frontend/lobby/client';
import type { LobbyRequest, RoomState } from '../shared/game/lobbyProtocol';
import { DEFAULT_ARENA } from '../shared/game/arenas';
import { DEFAULT_MATCH_SETTINGS } from '../shared/game/matchRules';

// Exercise the browser transport boundary: choices must reach an already identified
// connection, including after resume, rather than remaining only in localStorage.
test('choosing another avatar updates the connected profile and survives stale room data', () => {
    const saved = new Map<string, string>([
        ['throw.nick', 'Gracz'],
        ['throw.avatar', '🐻'],
    ]);
    class Socket {
        static OPEN = 1;
        static latest: Socket;
        readyState = 1;
        sent: Array<{ type: string; nick?: string; avatar?: string }> = [];
        onopen?: () => void;
        onmessage?: (event: { data: string }) => void;
        onclose?: () => void;
        onerror?: () => void;
        constructor() {
            Socket.latest = this;
        }
        send(data: string) {
            this.sent.push(JSON.parse(data));
        }
        close() {
            this.onclose?.();
        }
    }
    const replacements: Record<string, unknown> = {
        localStorage: {
            getItem: (key: string) => saved.get(key) ?? null,
            setItem: (key: string, value: string) => saved.set(key, value),
        },
        sessionStorage: { getItem: () => null, setItem: () => {} },
        location: { protocol: 'http:', host: 'localhost' },
        WebSocket: Socket,
    };
    const descriptors = Object.fromEntries(
        Object.keys(replacements).map((key) => [
            key,
            Object.getOwnPropertyDescriptor(globalThis, key),
        ]),
    );
    for (const [key, value] of Object.entries(replacements))
        Object.defineProperty(globalThis, key, { value, configurable: true });
    let client: LobbyClient | undefined;
    try {
        client = new LobbyClient();
        const socket = Socket.latest;
        socket.onopen!();
        socket.onmessage!({
            data: JSON.stringify({ type: 'identity', id: 'me', resumeToken: 'session' }),
        });
        assert.equal(client.setAvatar('🤖'), true);
        assert.deepEqual(socket.sent.at(-1), { type: 'hello', nick: 'Gracz', avatar: '🤖' });
        assert.equal(saved.get('throw.avatar'), '🤖');
        socket.onmessage!({
            data: JSON.stringify({
                type: 'room',
                room: { members: [{ id: 'me', nick: 'Gracz', seat: 0 }], messages: [] },
            }),
        });
        assert.equal(
            client.room!.members[0].avatar,
            '🤖',
            'Stale server data must not replace own choice with a bear',
        );
        assert.ok(client.error.includes('backendu'), 'Missing server metadata must be diagnosed');
        assert.equal(client.setAvatar('👮🏻'), true);
        assert.equal(socket.sent.at(-1)!.avatar, '👮🏻');
        socket.onmessage!({
            data: JSON.stringify({
                type: 'room',
                room: {
                    members: [
                        { id: 'me', nick: 'Gracz', seat: 0, avatar: '👮🏻' },
                        { id: 'other', nick: 'Inny', seat: 1, avatar: '🔥' },
                    ],
                    messages: [],
                },
            }),
        });
        assert.equal(client.room!.members[0].avatar, '👮🏻');
        assert.equal(client.room!.members[1].avatar, '🔥');
        const count = socket.sent.length;
        assert.equal(client.setAvatar('not emoji'), false);
        assert.equal(socket.sent.length, count);
    } finally {
        client?.dispose();
        for (const key of Object.keys(replacements)) {
            const descriptor = descriptors[key];
            if (descriptor) Object.defineProperty(globalThis, key, descriptor);
            else Reflect.deleteProperty(globalThis, key);
        }
    }
});

test('room preferences survive new clients without changing joined or resumed rooms', () => {
    const saved = new Map<string, string>();
    class Socket {
        static OPEN = 1;
        static latest: Socket;
        readyState = 1;
        sent: LobbyRequest[] = [];
        onmessage?: (event: { data: string }) => void;
        constructor() {
            Socket.latest = this;
        }
        send(data: string) {
            this.sent.push(JSON.parse(data));
        }
        close() {}
        receive(room: RoomState) {
            this.onmessage?.({ data: JSON.stringify({ type: 'room', room }) });
        }
    }
    const replacements: Record<string, unknown> = {
        localStorage: {
            getItem: (key: string) => saved.get(key) ?? null,
            setItem: (key: string, value: string) => saved.set(key, value),
        },
        sessionStorage: { getItem: () => null, setItem: () => {} },
        location: { protocol: 'http:', host: 'localhost' },
        WebSocket: Socket,
    };
    const descriptors = Object.fromEntries(
        Object.keys(replacements).map((key) => [
            key,
            Object.getOwnPropertyDescriptor(globalThis, key),
        ]),
    );
    for (const [key, value] of Object.entries(replacements))
        Object.defineProperty(globalThis, key, { value, configurable: true });
    const clients: LobbyClient[] = [];
    const connect = () => {
        const client = new LobbyClient();
        client.id = 'me';
        clients.push(client);
        return client;
    };
    const room: RoomState = {
        id: 'room',
        name: 'Wieczorny mecz',
        hostId: 'me',
        running: false,
        locked: false,
        ready: true,
        arena: { ...DEFAULT_ARENA },
        match: {
            settings: { ...DEFAULT_MATCH_SETTINGS },
            phase: 'waiting',
            remainingSeconds: 300,
            result: null,
        },
        members: [],
        messages: [],
    };
    const settings = { durationSeconds: 600, goalLimit: 0 };
    const arena = { id: 'large-rounded', skin: 'night' } as const;
    try {
        const first = connect();
        first.send({ type: 'create', name: room.name, password: 'secret' });
        Socket.latest.receive(room);
        first.send({ type: 'settings', name: 'Nowa nazwa', settings });
        first.send({ type: 'arena', arena });
        assert.equal(first.roomName, 'Nowa nazwa');
        assert.ok(!JSON.stringify([...saved]).includes('secret'));
        first.dispose();

        const second = connect();
        const socket = Socket.latest;
        assert.equal(second.roomName, 'Nowa nazwa');
        socket.receive(room);
        assert.deepEqual(socket.sent, [], 'Resuming must keep the server configuration');
        second.send({ type: 'join', roomId: room.id });
        socket.receive({ ...room, hostId: 'other' });
        assert.equal(socket.sent.length, 1, 'Joining must not apply local preferences');
        second.send({ type: 'arena', arena: DEFAULT_ARENA });
        assert.deepEqual(JSON.parse(saved.get('throw.arena')!), arena);

        second.send({ type: 'create', name: second.roomName });
        socket.receive({ ...room, id: 'new', name: second.roomName });
        assert.deepEqual(socket.sent.slice(-2), [
            { type: 'settings', name: 'Nowa nazwa', settings },
            { type: 'arena', arena },
        ]);
        const count = socket.sent.length;
        socket.receive(room);
        assert.equal(socket.sent.length, count, 'Preferences apply only once per creation');

        for (const [matchValue, arenaValue] of [
            ['broken JSON', 'null'],
            ['{"durationSeconds":1,"goalLimit":0}', '{"id":"missing","skin":"night"}'],
        ]) {
            saved.set('throw.matchSettings', matchValue);
            saved.set('throw.arena', arenaValue);
            second.send({ type: 'create', name: room.name });
            const before = socket.sent.length;
            socket.receive(room);
            assert.equal(socket.sent.length, before, 'Invalid preferences must be ignored');
        }
    } finally {
        for (const client of clients) client.dispose();
        for (const key of Object.keys(replacements)) {
            const descriptor = descriptors[key];
            if (descriptor) Object.defineProperty(globalThis, key, descriptor);
            else Reflect.deleteProperty(globalThis, key);
        }
    }
});
