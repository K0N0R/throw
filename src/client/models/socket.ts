import io from 'socket.io-client';
import { host, port } from '../../shared/serverConfig';
import { IRoomCreate, ILobbyRoom, IGameState } from '../../shared/events';

export class Socket {
    public static socket: SocketIOClient.Socket;
    public static nick: string;
    public static avatar: string;

    public static connect(nick: string, avatar: string, connected: () => void): void {
        this.nick = nick;
        this.avatar = avatar;
        this.socket = io({
            host: `${host}:${port}`
        });
        this.socket.on('connect', (socket) => {
            const connectionData = {
                nick: nick,
                avatar: avatar
            };
            // stringify prevents from avatar send issue
            this.socket.emit('connection::data', JSON.stringify(connectionData));
            connected();
        });
    }
    //#region lobby
    public static enterLobby(onLobbyChanged: (rooms: ILobbyRoom[]) => void): void {
        this.socket.emit('lobby::enter');
        this.socket.on('lobby::room-list', (rooms: ILobbyRoom[]) => {
            onLobbyChanged(rooms);
        });
    }

    public static leaveLobby(): void {
        this.socket.off('lobby::room-list')
    }
    //#endregion

    //#region room
    public static createRoom(data: IRoomCreate, created: (room: ILobbyRoom) => void): void {
        this.socket.emit('room::create', data);
        this.socket.on('room::created', (room: ILobbyRoom) => {
            created(room);
            this.socket.removeListener('room::created');
        });
    }

    public static joinRoom(roomId: string, password: string, joined: (room: ILobbyRoom) => void): void {
        this.socket.emit('room::join', {id: roomId, password });
        this.socket.on('room::joined', (room: ILobbyRoom) => {
            joined(room);
            this.socket.removeListener('room::joined');
        });
    }

    public static onRoomJoined(onRoomChanged: (room: ILobbyRoom) => void, onRoomDestroyed: (room: ILobbyRoom) => void): void {
        this.socket.on('room::changed', (room: ILobbyRoom) => {
            onRoomChanged(room);
        });
        this.socket.on('room::destroyed', (room: ILobbyRoom) => {
            this.socket.removeListener('room::changed');
            this.socket.removeListener('room::destroyed');
            this.socket.removeListener('game::state');
            onRoomDestroyed(room);
        });
    }

    public static updateRoom(room: ILobbyRoom): void {
        this.socket.emit('room::update', room);
    }

    public static leaveRoom(room: ILobbyRoom): void {
        this.socket.emit('room::leave', { id: room.id });
        this.socket.removeListener('room::changed');
        this.socket.removeListener('room::destroyed');
    }

    public static onGameJoined(onGameStateChange: (gameState: IGameState) => void): void {
        this.socket.on('game::state', (gameState: IGameState) => {
            onGameStateChange(gameState);
        });
    }
    //#endregion

}