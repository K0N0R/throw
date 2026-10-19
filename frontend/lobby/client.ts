import { DEFAULT_AVATAR, validAvatar, resolveAvatar } from '../../shared/game/avatars';
import { validArena } from '../../shared/game/arenas';
import { validMatchSettings } from '../../shared/game/matchRules';
import type {
    LobbyMessage,
    LobbyRequest,
    RoomInfo,
    RoomState,
} from '../../shared/game/lobbyProtocol';

export class LobbyClient {
    id = '';
    room: RoomState | null = null;
    rooms: RoomInfo[] = [];
    connected = false;
    error = '';
    nick = localStorage.getItem('throw.nick') ?? '';
    avatar = validAvatar(localStorage.getItem('throw.avatar'))
        ? localStorage.getItem('throw.avatar')!
        : DEFAULT_AVATAR;
    onChange = () => {};
    private socket?: WebSocket;
    private retry?: ReturnType<typeof setTimeout>;
    private stopped = false;
    private creating = false;
    private resumeToken = sessionStorage.getItem('throw.session') ?? '';
    get roomName() {
        return this.preference('roomName') ?? '';
    }
    private preference(key: string): string | null;
    private preference(key: string, value: string): void;
    private preference(key: string, value?: string) {
        try {
            if (value !== undefined) localStorage.setItem(`throw.${key}`, value);
            else return localStorage.getItem(`throw.${key}`);
        } catch {}
        return null;
    }
    private restoreRoomSettings() {
        for (const key of ['matchSettings', 'arena'] as const) {
            let value: unknown;
            try {
                value = JSON.parse(this.preference(key) ?? 'null');
            } catch {
                continue;
            }
            if (key === 'matchSettings' && validMatchSettings(value))
                this.send({ type: 'settings', name: this.room!.name, settings: value });
            if (key === 'arena' && validArena(value)) this.send({ type: 'arena', arena: value });
        }
    }
    constructor() {
        this.connect();
    }
    private connect() {
        const ws = (this.socket = new WebSocket(
            `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/lobby${this.resumeToken ? `?resume=${encodeURIComponent(this.resumeToken)}` : ''}`,
        ));
        ws.onopen = () => {
            this.connected = true;
            this.error = '';
            if (this.nick.length >= 2)
                this.send({ type: 'hello', nick: this.nick, avatar: this.avatar });
            this.onChange();
        };
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data) as LobbyMessage;
            if (message.type === 'identity') {
                this.id = message.id;
                this.resumeToken = message.resumeToken;
                sessionStorage.setItem('throw.session', this.resumeToken);
            }
            if (message.type === 'rooms') this.rooms = message.rooms;
            if (message.type === 'room') {
                if (message.room?.members.some((member) => member.avatar === undefined)) {
                    this.error =
                        'Serwer nie przesyła avatarów emoji. Zaktualizuj build backendu i uruchom ponownie proces serwera.';
                }
                this.room = message.room
                    ? {
                          ...message.room,
                          members: message.room.members.map((member) => ({
                              ...member,
                              avatar: resolveAvatar(
                                  member.avatar ??
                                      (member.id === this.id ? this.avatar : undefined),
                              ),
                          })),
                      }
                    : null;
                if (this.creating && this.room) {
                    this.creating = false;
                    if (this.room.hostId === this.id) this.restoreRoomSettings();
                }
            }
            if (message.type === 'error') {
                this.creating = false;
                this.error = message.message;
            }
            this.onChange();
        };
        ws.onerror = () => ws.close();
        ws.onclose = () => {
            if (this.stopped) return;
            this.connected = false;
            this.creating = false;

            this.error = 'Połączenie przerwane. Ponawiam…';
            this.onChange();
            this.retry = setTimeout(() => this.connect(), 1500);
        };
    }
    get gameToken() {
        return this.resumeToken;
    }
    setAvatar(avatar: string) {
        if (!validAvatar(avatar)) return false;
        this.avatar = avatar;
        localStorage.setItem('throw.avatar', avatar);
        if (this.nick.length >= 2) this.send({ type: 'hello', nick: this.nick, avatar });
        return true;
    }
    setNick(nick: string) {
        this.nick = nick.trim().slice(0, 20);
        localStorage.setItem('throw.nick', this.nick);
        this.send({ type: 'hello', nick: this.nick, avatar: this.avatar });
    }
    send(message: LobbyRequest) {
        if (this.socket?.readyState !== WebSocket.OPEN) return;
        this.error = '';
        this.socket.send(JSON.stringify(message));
        if (message.type === 'create') {
            this.creating = true;
            this.preference('roomName', message.name);
        }
        if (message.type === 'join' || message.type === 'leave') this.creating = false;
        if (this.room?.hostId === this.id && !this.room.running) {
            if (
                message.type === 'settings' &&
                message.name.trim() &&
                validMatchSettings(message.settings)
            ) {
                this.preference('roomName', message.name);
                this.preference('matchSettings', JSON.stringify(message.settings));
            }
            if (message.type === 'arena' && validArena(message.arena))
                this.preference('arena', JSON.stringify(message.arena));
        }
    }
    dispose() {
        this.stopped = true;
        clearTimeout(this.retry);
        this.socket?.close();
    }
}
