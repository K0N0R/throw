import io from 'socket.io-client';
import { host, port } from '../../shared/serverConfig';

export class User {
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
}