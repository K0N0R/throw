import io from 'socket.io';
import uuid from 'uuid';
import { User } from './user';
import { Game } from './../game/game';
import { ILobbyRoom } from '../../shared/events';
import { Team } from '../../shared/team';

export class Room {
    public id: string;
    public users: User[] = [];
    public timeLimit = 6;
    public scoreLimit = 10;
    public lastMessage: {
        nick: string;
        avatar: string;
        value: string;
    } | null;
    public newLastMessage = false;
    private game: Game | null;
    private gameInterval: any;

    public constructor(
        public io: io.Server,
        public adminId: string,
        public name: string,
        public password: string,
        public maxPlayersAmount: number,
        private onNotify: () => void,
        private onDestroy: () => void) {
        this.id = uuid();
    }

    public userJoins(user: User): void {
        const idx = this.users.indexOf(user);
        if (idx !== -1) return;

        this.users.push(user);
        user.socket.join(this.id);

        this.notifyChange();
        user.socket.emit('room::joined', this.getData(true));
        this.onUserJoins(user);
    }

    private onUserJoins(user: User): void {
        user.socket.on('room::user-created-game', () => this.onUserCreateGame(user));
        user.socket.on('room::update', (lobbyRoom: ILobbyRoom) => this.update(lobbyRoom, user));
        user.socket.on('room::leave', () => this.userLeaves(user));
        user.socket.on('disconnect', () => this.userLeaves(user));
    }

    private userLeaves(user: User): void {
        if (user.socket.id === this.adminId) { // admin of room leave
            this.users.forEach(this.kickUser.bind(this));
            this.io.to(this.id).emit('room::destroyed');
            this.onDestroy();
        } else { // user of room leave
            this.kickUser(user);
        }
        this.notifyChange();
    }

    private kickUser(user: User): void {
        user.socket.leave(this.id);
        const idx = this.users.indexOf(user)
        if (idx !== -1) this.users.splice(idx, 1);
        user.socket.removeAllListeners('room::user-created-game');
        user.socket.removeAllListeners('room::update');
        user.socket.removeAllListeners('room::leave');
        user.socket.removeAllListeners('disconnect');
    }

    private notifyChange(): void {
        this.io.to(this.id).emit('room::changed', this.getData(true));
        this.onNotify();
    }

    public getData(detailed?: boolean): ILobbyRoom {
        const lobbyRoom: ILobbyRoom = {
            id: this.id,
            name: this.name,
            playing: this.game != null,
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

    public update(room: ILobbyRoom, user: User): void {
        if (user.socket.id === this.adminId) {
            this.adminId = room.data.adminId;
            this.timeLimit = room.data.timeLimit;
            this.scoreLimit = room.data.scoreLimit;
            // react on data change
            let usersChanged = this.users.length !== room.data.users.length;
            this.users.forEach(thisUser => {
                const dataUser = room?.data?.users.find(item => item.socketId === thisUser.socket.id);
                if (!user) {
                    usersChanged = true;
                } else if (thisUser.team !== dataUser.team) {
                    usersChanged = true;
                    thisUser.team = dataUser.team ?? Team.Spectator;
                }
            });
            if (room.playing && !this.game) {
                this.startGame();
            } else if(!room.playing && this.game) {
                this.stopGame();
            } else if (room.playing && usersChanged) {
                this.game.updatePlayers(this.users);
            }
        }

        this.lastMessage = room.data.lastMessage;
        this.notifyChange();
        // clear temporary data - only for one notify
        this.lastMessage = null;
    }

    //#region game
    private onUserCreateGame(user): void {
        if (this.game) user.socket.emit('room::game-data', this.game.getGameData());
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
    //#endregion
}