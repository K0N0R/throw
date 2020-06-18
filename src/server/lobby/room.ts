import io from 'socket.io';
import uuid from 'uuid';
import { User } from './user';
import { Game, IGameConfig } from './../game/game';
import { ILobbyRoom } from '../../shared/events';

export class Room {
    public id: string;
    public left: User[] = [];
    public right: User[] = [];
    public spectators: User[] = [];
    public timeLimit = 6;
    public scoreLimit = 10;
    public messages = [];
    public constructor(
        public adminId: string,
        public name: string,
        public password: string,
        public maxPlayersAmount: number) {
        this.id = uuid();
    }

    public get allUsers(): User[] {
        return [...this.left, ...this.spectators, ...this.right];
    }

    public removeUser(user: User): void {
        const spectatorsIdx = this.spectators.indexOf(user);
        if (spectatorsIdx !== -1) {
            this.spectators.splice(spectatorsIdx,1);
            return;
        }
        const leftIdx = this.left.indexOf(user);
        if (spectatorsIdx !== -1) {
            this.left.splice(leftIdx,1);
            return;
        }
        const rightIdx = this.right.indexOf(user);
        if (spectatorsIdx !== -1) {
            this.right.splice(rightIdx,1);
            return;
        }
    }

    public join(user: User) {
        this.spectators.push(user);
    }

    public update(room: ILobbyRoom): void {
        if (room.data.adminId) {
            this.adminId = room.data.adminId;
            const allUsers = this.allUsers;
            this.left = this.allUsers.filter(user => room.data.left.find(leftUser => leftUser.socketId === user.socket.id));
            this.right = this.allUsers.filter(user => room.data.right.find(rightUser => rightUser.socketId === user.socket.id));
            this.spectators = this.allUsers.filter(user => room.data.spectators.find(spectatorUser => spectatorUser.socketId === user.socket.id));
            this.timeLimit = room.data.timeLimit;
            this.scoreLimit = room.data.scoreLimit;
            this.messages = [];
        }
    }

    public startGame(config: IGameConfig, io: io.Server): void {
        const game = new Game(config, this.id);
        setInterval(() => {
            game.run();
        }, 0);
    }

    public getData(detailed?: boolean): ILobbyRoom {
        const lobbyRoom: ILobbyRoom = {
            id: this.id,
            name: this.name,
            players: this.left.length + this.right.length + this.spectators.length,
        };
        if (detailed) {
            const mapUser = (user: User) => ({
                socketId: user.socket.id,
                nick: user.nick,
                avatar: user.avatar
            });
            lobbyRoom.data = {
                adminId: this.adminId,
                left: this.left.map(mapUser),
                right: this.right.map(mapUser),
                spectators: this.spectators.map(mapUser),
                timeLimit: this.timeLimit,
                scoreLimit: this.scoreLimit,
                messages: this.messages
            };
        }
        return lobbyRoom;
    }
}