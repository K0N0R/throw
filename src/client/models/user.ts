import io from 'socket.io-client';
import { host, port } from '../../shared/serverConfig';
import { IRoomCreate, ILobbyRoom } from 'shared/events';

export class User {
    public static socket: SocketIOClient.Socket;
    public static nick: string;
    public static avatar: string;
    public static lobbyRooms: ILobbyRoom[] = [];

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
        this.socket.on('lobby::room-list', (data: ILobbyRoom[]) => {
            this.lobbyRooms = data;
            if (this.onLobbyRoomsChange) this.onLobbyRoomsChange();
        });
    }

    public static onLobbyRoomsChange: (() => void) | null;
    public static setLobbyRoomsChange(onLobbyRoomsChange: (() => void) | null) {
        this.onLobbyRoomsChange = onLobbyRoomsChange;
    }

    public static onRoomChanges: ((room: ILobbyRoom) => void) | null;
    public static setRoomChange(onRoomChanges: ((room: ILobbyRoom) => void) | null) {
        this.onRoomChanges = onRoomChanges;
    }

    public static onRoomDestroyed: ((room: ILobbyRoom) => void) | null;
    public static setRoomDestroyed(onRoomDestroyed: ((room: ILobbyRoom) => void) | null) {
        this.onRoomDestroyed = onRoomDestroyed;
    }

    public static enterLobby(): void {
        this.socket.emit('lobby::enter');
    }

    public static leaveLobby(): void {
        this.socket.emit('lobby::leave');
    }

    public static createRoom(data: IRoomCreate, created: (room: ILobbyRoom) => void): void {
        this.socket.emit('room::create', data);
        this.socket.on('room::created', (room: ILobbyRoom) => {
            created(room);
            this.socket.removeListener('room::created');
        });
        this.onRoomJoin();

    }

    public static leaveRoom(room: ILobbyRoom): void {
        this.socket.emit('room::leave', { id: room.id });
        this.socket.removeListener('room::changed');
    }

    public static joinRoom(room: ILobbyRoom, password: string, joined: (room: ILobbyRoom) => void): void {
        this.socket.emit('room::join', {id: room.id, password });
        this.socket.on('room::joined', (room: ILobbyRoom) => {
            joined(room);
            this.socket.removeListener('room::joined');
        });
        this.onRoomJoin();
    }
    private static onRoomJoin(): void {
        this.socket.on('room::changed', (room: ILobbyRoom) => {
            if (this.onRoomChanges) this.onRoomChanges(room);
        });
        this.socket.on('room::destroyed', (room: ILobbyRoom) => {
            if (this.onRoomDestroyed) this.onRoomDestroyed(room);
        })
    }

    public static updateRoom(room: ILobbyRoom): void {
         this.socket.emit('room::update', room);
    }

}