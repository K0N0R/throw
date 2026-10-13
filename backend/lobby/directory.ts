import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { attachMatch } from '../game/match';
import type {
    ChatEntry,
    LobbyMessage,
    RoomInfo,
    RoomState,
    TeamChoice,
} from '../../shared/game/lobbyProtocol';
import { RULES } from '../../shared/game/simulation';

type Match = Awaited<ReturnType<typeof attachMatch>>;
interface Member {
    id: string;
    nick: string;
    socket: WebSocket;
    roomId?: string;
    seat: number | null;
    lastChat: number;
    alive: boolean;
}
interface Room {
    id: string;
    name: string;
    hostId: string;
    running: boolean;
    members: Set<Member>;
    messages: ChatEntry[];
    match: Match;
}
export function attachLobby(server: Server, legacy: Match) {
    const wss = new WebSocketServer({ noServer: true, maxPayload: 2048 });
    const members = new Set<Member>(),
        rooms = new Map<string, Room>();
    let chatId = 0,
        stopped = false;
    const send = (member: Member, message: LobbyMessage) => {
        if (member.socket.readyState !== WebSocket.OPEN) return;
        if (member.socket.bufferedAmount > 65536) {
            member.socket.terminate();
            return;
        }
        member.socket.send(JSON.stringify(message));
    };
    const info = (r: Room): RoomInfo => ({
        id: r.id,
        name: r.name,
        hostId: r.hostId,
        running: r.running,
        players: [...r.members].filter((m) => m.seat !== null).length,
        members: r.members.size,
    });
    const state = (r: Room): RoomState => ({
        id: r.id,
        name: r.name,
        hostId: r.hostId,
        running: r.running,
        ready: r.match.canStart(),
        members: [...r.members].map(({ id, nick, seat }) => ({ id, nick, seat })),
        messages: r.messages,
    });
    const publishList = () => {
        for (const m of members) send(m, { type: 'rooms', rooms: [...rooms.values()].map(info) });
    };
    const publish = (r: Room) => {
        for (const m of r.members) send(m, { type: 'room', room: state(r) });
        publishList();
    };
    const message = (r: Room, text: string, nick?: string) => {
        r.messages.push({
            id: ++chatId,
            kind: nick ? 'chat' : 'system',
            text,
            nick,
            time: Date.now(),
        });
        if (r.messages.length > 80) r.messages.shift();
        publish(r);
    };
    const roomFor = (m: Member) => (m.roomId ? rooms.get(m.roomId) : undefined);
    const chooseSeat = (r: Room, team?: TeamChoice) => {
        if (team === 'spectator') return null;
        return (
            Array.from({ length: RULES.maxPlayers }, (_, i) => i).find(
                (i) =>
                    (team === undefined || i % 2 === (team === 'blue' ? 0 : 1)) &&
                    ![...r.members].some((m) => m.seat === i),
            ) ?? null
        );
    };
    const leave = (m: Member) => {
        const r = roomFor(m);
        m.roomId = undefined;
        m.seat = null;
        if (!r) return;
        r.members.delete(m);
        r.match.disconnectMember(m.id);
        send(m, { type: 'room', room: null });
        if (!r.members.size) {
            r.match.dispose();
            rooms.delete(r.id);
            publishList();
            return;
        }
        message(r, `${m.nick} opuścił pokój.`);
        if (r.hostId === m.id) {
            r.hostId = [...r.members][0].id;
            message(r, `Nowy gospodarz: ${[...r.members][0].nick}.`);
        }
        if (![...r.members].some((p) => p.seat !== null) && r.running) {
            r.running = false;
            r.match.stop();
            message(r, 'Mecz zatrzymany — brak graczy.');
        }
        publish(r);
    };
    const join = (m: Member, r: Room) => {
        if (m.roomId === r.id) {
            send(m, { type: 'room', room: state(r) });
            return;
        }
        if (r.members.size >= 40) throw new Error('Pokój jest pełny.');
        leave(m);
        m.seat = chooseSeat(r);
        m.roomId = r.id;
        r.members.add(m);
        message(
            r,
            `${m.nick} dołączył do pokoju${m.seat === null ? ' jako widz' : ` jako ${String.fromCharCode(65 + m.seat)}`}.`,
        );
    };
    wss.on('connection', (socket) => {
        const m: Member = {
            id: randomUUID(),
            nick: '',
            socket,
            seat: null,
            lastChat: 0,
            alive: true,
        };
        members.add(m);
        send(m, { type: 'identity', id: m.id });
        publishList();
        socket.on('pong', () => {
            m.alive = true;
        });
        socket.on('error', () => socket.terminate());
        let handling = Promise.resolve();
        socket.on('message', (raw, binary) => {
            if (binary || stopped) return;
            handling = handling
                .then(async () => {
                    if (socket.readyState !== WebSocket.OPEN) return;
                    let data;
                    try {
                        data = JSON.parse(raw.toString());
                    } catch {
                        return;
                    }
                    if (!data || typeof data !== 'object') return;
                    const text = (value: unknown, max: number) =>
                        typeof value === 'string' ? value.trim().slice(0, max) : '';
                    try {
                        if (data.type === 'hello') {
                            const nick = text(data.nick, 20);
                            if (nick.length < 2)
                                throw new Error('Nick musi mieć od 2 do 20 znaków.');
                            m.nick = nick;
                            return;
                        }
                        if (!m.nick) throw new Error('Najpierw wpisz nick.');
                        if (data.type === 'create') {
                            const name = text(data.name, 40);
                            if (!name) throw new Error('Wpisz nazwę pokoju.');
                            if (rooms.size >= 30) throw new Error('Limit pokoi został osiągnięty.');
                            const id = randomUUID().slice(0, 8);
                            let r: Room;
                            const match = await attachMatch(server, {
                                noServer: true,
                                resolveMember: (request) => {
                                    const token = new URL(
                                        request.url!,
                                        'http://localhost',
                                    ).searchParams.get('member');
                                    const member = [...r.members].find(
                                        (member) =>
                                            member.id === token &&
                                            member.socket.readyState === WebSocket.OPEN,
                                    );
                                    return member
                                        ? { id: member.id, seat: member.seat }
                                        : undefined;
                                },
                                canPlay: () => r.running,
                                mayReset: (id) => r.hostId === id,
                                onRosterChanged: () => publish(r),
                                onGoal: (team) => message(r, `Gol! ${team}.`),
                            });
                            r = {
                                id,
                                name,
                                hostId: m.id,
                                running: false,
                                members: new Set(),
                                messages: [],
                                match,
                            };
                            if (socket.readyState !== WebSocket.OPEN) {
                                match.dispose();
                                return;
                            }
                            rooms.set(id, r);
                            join(m, r);
                            return;
                        }
                        if (data.type === 'join') {
                            const r = rooms.get(text(data.roomId, 64));
                            if (!r) throw new Error('Pokój już nie istnieje.');
                            join(m, r);
                            return;
                        }
                        if (data.type === 'leave') {
                            leave(m);
                            return;
                        }
                        const r = roomFor(m);
                        if (!r) throw new Error('Dołącz do pokoju.');
                        if (data.type === 'chat') {
                            const value = text(data.text, 320);
                            if (!value) return;
                            if (Date.now() - m.lastChat < 500)
                                throw new Error('Wysyłasz wiadomości zbyt szybko.');
                            m.lastChat = Date.now();
                            message(r, value, m.nick);
                            return;
                        }
                        if (data.type === 'team') {
                            if (!['blue', 'orange', 'spectator'].includes(data.team)) return;
                            if (
                                m.seat !== null &&
                                data.team !== 'spectator' &&
                                m.seat % 2 === (data.team === 'blue' ? 0 : 1)
                            )
                                return;
                            const seat = chooseSeat(r, data.team);
                            if (data.team !== 'spectator' && seat === null)
                                throw new Error('Ta drużyna ma już pięciu graczy.');
                            if (
                                m.seat !== null &&
                                data.team !== 'spectator' &&
                                m.seat % 2 === (data.team === 'blue' ? 0 : 1)
                            )
                                return;
                            m.seat = seat;
                            r.match.disconnectMember(m.id);
                            message(
                                r,
                                `${m.nick}: ${seat === null ? 'obserwator' : seat % 2 === 0 ? 'niebiescy' : 'pomarańczowi'}.`,
                            );
                            return;
                        }
                        if (data.type === 'start' || data.type === 'stop') {
                            if (r.hostId !== m.id)
                                throw new Error('Tylko gospodarz może zarządzać meczem.');
                            if (data.type === 'start') {
                                if (r.running) return;
                                if (
                                    ![0, 1].every((team) =>
                                        [...r.members].some(
                                            (p) => p.seat !== null && p.seat % 2 === team,
                                        ),
                                    )
                                )
                                    throw new Error('Potrzebny jest gracz w obu drużynach.');
                                if (!r.match.canStart())
                                    throw new Error(
                                        'Gracze jeszcze się łączą z meczem. Spróbuj za chwilę.',
                                    );
                                r.running = true;
                                r.match.restart();
                                message(r, 'Mecz rozpoczęty!');
                            } else {
                                r.running = false;
                                r.match.stop();
                                message(r, 'Gospodarz zatrzymał mecz.');
                            }
                        }
                    } catch (error) {
                        send(m, {
                            type: 'error',
                            message:
                                error instanceof Error
                                    ? error.message
                                    : 'Nie udało się wykonać operacji.',
                        });
                    }
                })
                .catch((error) => console.error(error));
        });
        socket.on('close', () => {
            members.delete(m);
            if (!stopped) leave(m);
        });
    });
    const upgrade = (
        request: import('node:http').IncomingMessage,
        socket: import('node:stream').Duplex,
        head: Buffer,
    ) => {
        const url = new URL(request.url!, 'http://localhost');
        if (url.pathname === '/lobby')
            wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request));
        else if (url.pathname === '/game') {
            const id = url.searchParams.get('room');
            if (!id) legacy.upgrade(request, socket, head);
            else {
                const r = rooms.get(id);
                if (r) r.match.upgrade(request, socket, head);
                else socket.destroy();
            }
        } else socket.destroy();
    };
    server.on('upgrade', upgrade);
    const heartbeat = setInterval(() => {
        for (const m of members) {
            if (!m.alive) m.socket.terminate();
            else {
                m.alive = false;
                m.socket.ping();
            }
        }
    }, 5000);
    return {
        metrics: () => [...rooms.values()].map((r) => ({ ...info(r), match: r.match.metrics() })),
        dispose() {
            if (stopped) return;
            stopped = true;
            clearInterval(heartbeat);
            server.off('upgrade', upgrade);
            for (const m of members) m.socket.terminate();
            members.clear();
            for (const r of rooms.values()) r.match.dispose();
            rooms.clear();
            wss.close();
        },
    };
}
