import test from 'node:test';
import assert from 'node:assert/strict';
import { LobbyClient } from '../frontend/lobby/client';

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
