import io from 'socket.io';
import uuid from 'uuid';

import { IConnectionData, IRoomCreate, IRoomLeave, IRoomJoin, ILobbyRoom } from './../../shared/events';

import { User } from './user';
import { Room } from './room';


export class Lobby {
    private lobbyId = uuid();
    public rooms: Room[] = [];
    public constructor(private io: io.Server) {
        this.initConnection(io);
    }

    public initConnection(io: io.Server): void {
        this.io.on('connection', (socket: io.Socket) => {
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
                user.socket.id,
                data.name,
                data.password,
                data.maxPlayersAmount,
                () => {
                    this.io.to(this.lobbyId).emit('lobby::room-list', this.rooms.map(item => item.getData()));
                },
                () => {
                    const idx = this.rooms.indexOf(room);
                    this.rooms.splice(idx, 1);
                });
            this.rooms.push(room);
            room.userJoins(user);
            user.socket.emit('room::created', room.getData(true));
        });
        user.socket.on('room::join', (data: IRoomJoin) => {
            const room = this.rooms.find(item => item.id === data.id);
            if (room  && room.password === data.password) {
                room.userJoins(user);
            }
        });
        //#endregion

        //#region lobby
        user.socket.on('lobby::enter', () => {
            user.socket.join(this.lobbyId);
            user.socket.emit('lobby::room-list', this.rooms.map(room => room.getData()));
        });
        user.socket.on('lobby::leave', () => {
            user.socket.leave(this.lobbyId);
        });
        //#endregion
    }
}