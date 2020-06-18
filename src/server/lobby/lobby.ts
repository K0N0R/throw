import io from 'socket.io';
import uuid from 'uuid';

import { IConnectionData, IRoomCreate, IRoomLeave, IRoomJoin, ILobbyRoom } from './../../shared/events';

import { User } from './user';
import { Room } from './room';


export class Lobby {
    private lobbyId = uuid();
    public users: User[] = []
    public rooms: Room[] = [];
    public io: io.Server;
    public constructor(io: io.Server) {
        this.initConnection(io);
    }

    public initConnection(io: io.Server): void {
        this.io = io;
        this.io.on('connection', (socket: io.Socket) => {
            socket.on('connection::data', (data: string) => {
                const parsedData: IConnectionData = JSON.parse(data);
                const user = new User(socket, parsedData.nick, parsedData.avatar)
                this.users.push(user);
                this.manageRoomEvents(user);
            });
        });
    }

    private manageRoomEvents(user: User): void {
        //#region general
        user.socket.on('disconnect', () => {
            this.userLeaveRoom(user);
        });
        //#endregion

        //#region room
        user.socket.on('room::create', (data: IRoomCreate) => {
            const room = new Room(user.socket.id, data.name, data.password, data.maxPlayersAmount);
            this.rooms.push(room);
            this.userJoinRoom(user, room);
            user.socket.emit('room::created', room.getData(true));
        });
        user.socket.on('room::leave', (data: IRoomLeave) => {
            this.userLeaveRoom(user);
        });
        user.socket.on('room::join', (data: IRoomJoin) => {
            const room = this.rooms.find(item => item.id === data.id);
            if (room  && room.password === data.password) {
                this.userJoinRoom(user, room);
            }
        });
        //#endregion

        //#region lobby
        user.socket.on('lobby::enter', () => {
            user.socket.join(this.lobbyId);
            user.socket.emit('lobby::room-list', this.rooms.map(item => ({ id: item.id, name: item.name, players: item.spectators.length})));
        });
        user.socket.on('lobby::leave', () => {
            user.socket.leave(this.lobbyId);
        });
        //#endregion
    }

    private userLeaveRoom(user: User): void {
        const room = this.rooms.find(item => item.id === user.socket.id);
        if (!room) return; // user wasnt in room

        // admin of room leave
        if (user.socket.id === room.adminId) {
            this.io.to(room.id).emit('room::destroyed');
            room.allUsers.forEach(user => {
                user.socket.leave(room.id);
            });
            const idx = this.rooms.indexOf(room);
            this.rooms.splice(idx, 1);
        } else { // user of room leave
            user.socket.leave(room.id);
            room.removeUser(user);
            const idx = room.spectators.indexOf(user);
            room.spectators.splice(idx, 1);
        }
        this.updateLobbyList();
        user.socket.emit('room::changed', room.getData(true));

    }

    private userJoinRoom(user: User, room: Room): void {
        room.join(user);
        this.updateLobbyList();
        user.socket.emit('room::joined');
        user.socket.emit('room::changed', room.getData(true));
        user.socket.on('room::update', (lobbyRoom: ILobbyRoom) => {
            room.update(lobbyRoom)
            this.io.to(this.lobbyId).emit('room::changed');
        });
    }

    private updateLobbyList(): void {
        this.io.to(this.lobbyId).emit('lobby::room-list', this.rooms.map(item => item.getData()));
    }
    
}