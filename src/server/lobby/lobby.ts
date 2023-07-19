import {Server, Socket} from 'socket.io';
import { IConnectionData, IRoomCreate, IRoomJoin } from './../../shared/events';
import { User } from './user';
import { Room } from './room';


export class Lobby {
    public rooms: Room[] = [];
    public constructor(private io: Server) {
        this.initConnection();
    }

    public initConnection(): void {
        this.io.on('connection', (socket: Socket) => {
            socket.on('connection::data', (data: string) => {
                const parsedData: IConnectionData = JSON.parse(data);
                const user = new User(socket, parsedData.nick, parsedData.avatar)
                this.bindUserEvents(user);
            });
        });
    }

    private bindUserEvents(user: User): void {
        //#region room
        user.socket.on('room::create', (data: IRoomCreate) => {
            const room = new Room(
                this.io,
                user,
                data.name,
                data.password,
                data.maxPlayersAmount,
                () => {
                    const idx = this.rooms.indexOf(room);
                    this.rooms.splice(idx, 1);
                });
            this.rooms.push(room);
            this.io.emit('lobby::room-list', this.rooms.map(item => item.getData()));
        });
        user.socket.on('room::join', (data: IRoomJoin) => {
            const room = this.rooms.find(item => item.id === data.id);
            if (room && room.password === data.password) {
                room.joinUser(user);
            }
        });

        user.socket.on('lobby::enter', () => {
            user.socket.emit('lobby::room-list', this.rooms.map(item => item.getData()));
        });
        //#endregion
    }
    
}
