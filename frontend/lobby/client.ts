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
    onChange = () => {};
    private socket?: WebSocket;
    private retry?: ReturnType<typeof setTimeout>;
    private stopped = false;
    private resumeToken = sessionStorage.getItem('throw.session') ?? '';
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
            if (this.nick.length >= 2) this.send({ type: 'hello', nick: this.nick });
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
            if (message.type === 'room') this.room = message.room;
            if (message.type === 'error') this.error = message.message;
            this.onChange();
        };
        ws.onerror = () => ws.close();
        ws.onclose = () => {
            if (this.stopped) return;
            this.connected = false;

            this.error = 'Połączenie przerwane. Ponawiam…';
            this.onChange();
            this.retry = setTimeout(() => this.connect(), 1500);
        };
    }
    get gameToken() {
        return this.resumeToken;
    }
    setNick(nick: string) {
        this.nick = nick.trim().slice(0, 20);
        localStorage.setItem('throw.nick', this.nick);
        this.send({ type: 'hello', nick: this.nick });
    }
    send(message: LobbyRequest) {
        if (this.socket?.readyState !== WebSocket.OPEN) return;
        this.error = '';
        this.socket.send(JSON.stringify(message));
    }
    dispose() {
        this.stopped = true;
        clearTimeout(this.retry);
        this.socket?.close();
    }
}
