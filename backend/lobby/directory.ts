import { validArena, ARENAS, ARENA_SKINS } from '../../shared/game/arenas';
import { DEFAULT_AVATAR, validAvatar } from '../../shared/game/avatars';
import { randomUUID, createHash, timingSafeEqual } from 'node:crypto';
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
import { MatchFlow, validMatchSettings } from '../../shared/game/matchRules';
import { RULES } from '../../shared/game/simulation';

type Match = Awaited<ReturnType<typeof attachMatch>>;
interface Member {
    id: string;
    nick: string;
    avatar: string;
    socket: WebSocket;
    roomId?: string;
    seat: number | null;
    lastChat: number;
    alive: boolean;
    resumeToken: string;
    expiry?: ReturnType<typeof setTimeout>;
    joinBlockedUntil: Map<string, number>;
    lastPasswordAttempt: number;
}
interface Room {
    id: string;
    name: string;
    hostId: string;
    running: boolean;
    members: Set<Member>;
    messages: ChatEntry[];
    match: Match;
    flow: MatchFlow;
    lastClock: number | null;
    passwordSalt: string;
    passwordHash: Buffer | null;
}
export function attachLobby(server: Server, legacy: Match, reconnectMs = 15000) {
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
        locked: r.passwordHash !== null,
        players: [...r.members].filter((m) => m.seat !== null).length,
        members: r.members.size,
    });
    const state = (r: Room): RoomState => ({
        id: r.id,
        name: r.name,
        hostId: r.hostId,
        running: r.running,
        locked: r.passwordHash !== null,
        ready: r.match.canStart(),
        arena: r.match.arena(),
        match: r.flow.snapshot(),
        members: [...r.members].map(({ id, nick, avatar, seat, socket }) => ({
            id,
            nick,
            avatar,
            seat,
            connected: socket.readyState === WebSocket.OPEN,
        })),
        messages: r.messages,
    });
    const publishList = () => {
        for (const m of members) send(m, { type: 'rooms', rooms: [...rooms.values()].map(info) });
    };
    const publish = (r: Room) => {
        for (const m of r.members) send(m, { type: 'room', room: state(r) });
        publishList();
    };
    const message = (r: Room, text: string, nick?: string, avatar?: string) => {
        r.messages.push({
            id: ++chatId,
            kind: nick ? 'chat' : 'system',
            text,
            nick,
            avatar,
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
    const stopIfEmpty = (r: Room) => {
        if (![...r.members].some((p) => p.seat !== null) && r.running) {
            r.running = false;
            r.flow.stop();
            r.match.stop();
            message(r, 'Mecz zatrzymany — brak graczy.');
        }
    };
    const password = (value: unknown) => {
        if (value === undefined) return '';
        if (typeof value !== 'string' || value.length > 64)
            throw new Error('Hasło może mieć maksymalnie 64 znaki.');
        return value;
    };
    const hash = (r: Pick<Room, 'passwordSalt'>, value: string) =>
        createHash('sha256').update(r.passwordSalt).update(value).digest();
    const changeTeam = (r: Room, target: Member, team: TeamChoice) => {
        if (!['blue', 'orange', 'spectator'].includes(team))
            throw new Error('Nieprawidłowa drużyna.');
        if (
            (target.seat === null && team === 'spectator') ||
            (target.seat !== null &&
                team !== 'spectator' &&
                target.seat % 2 === (team === 'blue' ? 0 : 1))
        )
            return;
        const seat = chooseSeat(r, team);
        if (team !== 'spectator' && seat === null)
            throw new Error('Ta drużyna ma już pięciu graczy.');
        target.seat = seat;
        r.match.disconnectMember(target.id);
        message(
            r,
            `${target.nick}: ${seat === null ? 'obserwator' : seat % 2 === 0 ? 'niebiescy' : 'pomarańczowi'}.`,
        );
        stopIfEmpty(r);
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
        stopIfEmpty(r);
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
    wss.on('connection', (socket, request) => {
        const token = new URL(request.url!, 'http://localhost').searchParams.get('resume');
        const previous = [...members].find(
            (member) => member.resumeToken === token && member.socket.readyState !== WebSocket.OPEN,
        );
        const m: Member = previous ?? {
            id: randomUUID(),
            nick: '',
            avatar: DEFAULT_AVATAR,
            socket,
            seat: null,
            lastChat: 0,
            alive: true,
            resumeToken: randomUUID(),
            joinBlockedUntil: new Map(),
            lastPasswordAttempt: 0,
        };
        clearTimeout(m.expiry);
        m.expiry = undefined;
        m.socket = socket;
        m.alive = true;
        members.add(m);
        send(m, { type: 'identity', id: m.id, resumeToken: m.resumeToken });
        const resumedRoom = roomFor(m);
        if (resumedRoom) message(resumedRoom, `${m.nick} wrócił do pokoju.`);
        else send(m, { type: 'room', room: null });
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
                            const avatar = data.avatar === undefined ? m.avatar : data.avatar;
                            if (!validAvatar(avatar))
                                throw new Error('Avatar musi być jednym emoji.');
                            const changed = m.nick !== nick || m.avatar !== avatar;
                            m.nick = nick;
                            m.avatar = avatar;
                            const currentRoom = roomFor(m);
                            if (changed && currentRoom) publish(currentRoom);
                            return;
                        }
                        if (!m.nick) throw new Error('Najpierw wpisz nick.');
                        if (data.type === 'create') {
                            const name = text(data.name, 40);
                            if (!name) throw new Error('Wpisz nazwę pokoju.');
                            if (rooms.size >= 30) throw new Error('Limit pokoi został osiągnięty.');
                            const roomPassword = password(data.password);
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
                                            member.resumeToken === token &&
                                            member.socket.readyState === WebSocket.OPEN,
                                    );
                                    return member
                                        ? { id: member.id, seat: member.seat }
                                        : undefined;
                                },
                                canPlay: () => r.running,
                                allowKickoff: () => r.flow.canKickoff,
                                mayReset: (id) => r.hostId === id,
                                onRosterChanged: () => publish(r),
                                onGoal: (team) => message(r, `Gol! ${team}.`),
                                onStep: (seconds, score, goal) => {
                                    if (r.flow.step(seconds, score, goal)) {
                                        r.running = false;
                                        const result = r.flow.snapshot().result!;
                                        const winner =
                                            result.winner === 'draw'
                                                ? 'Remis'
                                                : result.winner === 'blue'
                                                  ? 'Wygrywają niebiescy'
                                                  : 'Wygrywają pomarańczowi';
                                        message(
                                            r,
                                            `Koniec meczu! ${winner}, ${result.score[0]} : ${result.score[1]}.`,
                                        );
                                    } else {
                                        const clock = r.flow.snapshot().remainingSeconds;
                                        if (clock !== r.lastClock) {
                                            r.lastClock = clock;
                                            for (const member of r.members)
                                                send(member, { type: 'room', room: state(r) });
                                        }
                                    }
                                },
                            });
                            r = {
                                id,
                                name,
                                hostId: m.id,
                                running: false,
                                members: new Set(),
                                messages: [],
                                match,
                                flow: new MatchFlow(),
                                lastClock: null,
                                passwordSalt: randomUUID(),
                                passwordHash: null,
                            };
                            if (socket.readyState !== WebSocket.OPEN) {
                                match.dispose();
                                return;
                            }
                            if (roomPassword) r.passwordHash = hash(r, roomPassword);
                            rooms.set(id, r);
                            join(m, r);
                            return;
                        }
                        if (data.type === 'join') {
                            const r = rooms.get(text(data.roomId, 64));
                            if (!r) throw new Error('Pokój już nie istnieje.');
                            if ((m.joinBlockedUntil.get(r.id) ?? 0) > Date.now())
                                throw new Error(
                                    'Wyrzucono Cię z tego pokoju. Możesz wrócić po 30 sekundach.',
                                );
                            if (m.roomId !== r.id && r.passwordHash) {
                                if (Date.now() - m.lastPasswordAttempt < 1000)
                                    throw new Error('Spróbuj ponownie za sekundę.');
                                m.lastPasswordAttempt = Date.now();
                                if (
                                    !timingSafeEqual(
                                        hash(r, password(data.password)),
                                        r.passwordHash,
                                    )
                                )
                                    throw new Error('Nieprawidłowe hasło pokoju.');
                            }
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
                            message(r, value, m.nick, m.avatar);
                            return;
                        }
                        if (data.type === 'team') {
                            changeTeam(r, m, data.team);
                            return;
                        }
                        if (['move', 'transfer', 'kick', 'access'].includes(data.type)) {
                            if (r.hostId !== m.id)
                                throw new Error('Tylko gospodarz może zarządzać pokojem.');
                            if (data.type === 'access') {
                                const value = password(data.password);
                                r.passwordHash = value ? hash(r, value) : null;
                                message(
                                    r,
                                    value
                                        ? 'Gospodarz zabezpieczył pokój hasłem.'
                                        : 'Gospodarz wyłączył hasło pokoju.',
                                );
                                return;
                            }
                            const target = [...r.members].find(
                                (member) => member.id === data.memberId,
                            );
                            if (!target) throw new Error('Ta osoba nie jest już w pokoju.');
                            if (data.type === 'move') changeTeam(r, target, data.team);
                            else if (data.type === 'transfer') {
                                if (target === m) return;
                                if (target.socket.readyState !== WebSocket.OPEN)
                                    throw new Error('Przekaż rolę połączonej osobie.');
                                r.hostId = target.id;
                                message(r, `Nowy gospodarz: ${target.nick}.`);
                            } else {
                                if (target === m)
                                    throw new Error('Aby wyjść, użyj przycisku Wyjdź do lobby.');
                                target.joinBlockedUntil.set(r.id, Date.now() + 30000);
                                leave(target);
                                send(target, {
                                    type: 'error',
                                    message:
                                        'Gospodarz wyrzucił Cię z pokoju. Możesz wrócić po 30 sekundach.',
                                });
                                message(r, `${m.nick} wyrzucił z pokoju: ${target.nick}.`);
                            }
                            return;
                        }
                        if (data.type === 'arena') {
                            if (r.hostId !== m.id)
                                throw new Error('Tylko gospodarz może zmieniać boisko.');
                            if (r.running) throw new Error('Boisko można zmienić przed meczem.');
                            if (!validArena(data.arena))
                                throw new Error('Nieprawidłowe boisko lub wygląd.');
                            r.match.configureArena(data.arena);
                            message(
                                r,
                                `Boisko: ${ARENAS[data.arena.id as keyof typeof ARENAS].name}, ${ARENA_SKINS[data.arena.skin as keyof typeof ARENA_SKINS].name}.`,
                            );
                            return;
                        }
                        if (data.type === 'settings') {
                            if (r.hostId !== m.id)
                                throw new Error('Tylko gospodarz może zmieniać ustawienia.');
                            if (r.running)
                                throw new Error('Ustawienia można zmieniać przed meczem.');
                            const name = text(data.name, 40);
                            if (!name || !validMatchSettings(data.settings))
                                throw new Error(
                                    'Podaj nazwę, czas 10–3600 sekund lub 0 i limit 0–50 goli. Co najmniej jeden limit musi być aktywny.',
                                );
                            r.name = name;
                            r.flow.configure(data.settings);
                            message(r, 'Gospodarz zmienił ustawienia meczu.');
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
                                r.flow.start();
                                r.lastClock = r.flow.snapshot().remainingSeconds;
                                r.match.restart();
                                message(r, 'Mecz rozpoczęty!');
                            } else {
                                r.running = false;
                                r.flow.stop();
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
            if (stopped || m.socket !== socket) return;
            const r = roomFor(m);
            if (r) {
                r.match.disconnectMember(m.id);
                message(r, `${m.nick} utracił połączenie — czekamy na powrót.`);
            }
            m.expiry = setTimeout(() => {
                members.delete(m);
                if (!stopped) leave(m);
            }, reconnectMs);
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
            if (m.socket.readyState !== WebSocket.OPEN) continue;
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
            for (const m of members) {
                clearTimeout(m.expiry);
                m.socket.terminate();
            }
            members.clear();
            for (const r of rooms.values()) r.match.dispose();
            rooms.clear();
            wss.close();
        },
    };
}
