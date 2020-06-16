import io from 'socket.io-client';
import { host, port } from '../../shared/serverConfig';
import { IRoomCreate, ILobbyRoom } from 'shared/events';

export class User {
    public static socket: SocketIOClient.Socket;
    public static nick: string;
    public static avatar: string;
    public static availableRooms: ILobbyRoom[] = [];

    public static connect(nick, avatar, callback): void {
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
            callback();
        });
        this.socket.on('lobby::room-list', (data: ILobbyRoom[]) => {
            this.availableRooms = data;
            this.onAvailableRoomsChangeCallback();
        });
    }

    public static enterLobby(): void {
        this.socket.emit('lobby::enter');
    }

    public static leaveLobby(): void {
        this.socket.emit('lobby::leave');
    }

    public static createRoom(data: IRoomCreate): void {
        this.socket.emit('room::create', data);
    }

    public static joinRoom(room: ILobbyRoom, password: string, successCallback): void {
        this.socket.emit('room::join', {id: room.id, password });
        this.socket.on('room::joined', () => {
            successCallback();
            this.socket.removeListener('room::joined');
        });
    }

    public static onAvailableRoomsChangeCallback: () => void;
    public static setAvailableRoomsCallback(callback) {
        this.onAvailableRoomsChangeCallback = callback;
    }

}