import io from 'socket.io';
import uuid from 'uuid';
import { User } from './user';
import { Game } from './../game/game';
import { ILobbyRoom } from '../../shared/events';
import { Team } from '../../shared/team';

export class Room {
    public id: string;
    public playing: boolean = false;
    public users: User[] = [];
    public timeLimit = 6;
    public scoreLimit = 10;
    public lastMessage: {
        nick: string;
        avatar: string;
        value: string;
    } | null;
    public newLastMessage = false;
    private game: Game;
    private gameInterval: any;

    public constructor(
        public io: io.Server,
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
        user.socket.join(this.id);
    }

    public resetTemporary(): void {
        this.lastMessage = null;
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
            this.lastMessage = room.data.lastMessage;
            if (room.playing && !this.playing) {
                this.startGame();
            } else if(!room.playing && this.playing) {
                this.stopGame();
            }
            this.playing = room.playing;
        }
    }


    public startGame(): void {
        this.game = new Game(this.io, this.users, this.timeLimit, this.scoreLimit, this.id);
        this.gameInterval = setInterval(() => {
            this.game.run();
        }, 0);
    }

    public stopGame(): void {
        clearInterval(this.gameInterval);
    }

    public getData(detailed?: boolean): ILobbyRoom {
        const lobbyRoom: ILobbyRoom = {
            id: this.id,
            name: this.name,
            playing: this.playing,
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
                lastMessage: this.lastMessage
            };
        }
        return lobbyRoom;
    }
}