import io from 'socket.io';
import uuid from 'uuid';
import { User } from './user';
import { Game, IGameConfig } from './../game/game';
import { ILobbyRoom } from '../../shared/events';
import { Team } from '../../shared/team';

export class Room {
    public id: string;
    public users: User[] = [];
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

    public removeUser(user: User): void {
        const idx = this.users.indexOf(user);
        if (idx !== -1) {
            this.users.splice(idx,1);
        }
    }

    public join(user: User) {
        this.users.push(user);
    }

    public update(room: ILobbyRoom): void {
        if (room?.data?.adminId) {
            this.adminId = room.data.adminId;
            this.users.forEach(user => {
                const userTeam = room?.data?.users.find(item => item.socketId === user.socket.id)?.team;
                user.team = userTeam ?? Team.Spectator;
            });
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
            players: this.users.length,
        };
        if (detailed) {
            const mapUser = (user: User) => ({
                socketId: user.socket.id,
                nick: user.nick,
                avatar: user.avatar,
                team: user.team
            });
            lobbyRoom.data = {
                adminId: this.adminId,
                users: this.users.map(mapUser),
                timeLimit: this.timeLimit,
                scoreLimit: this.scoreLimit,
                messages: this.messages
            };
        }
        return lobbyRoom;
    }
}