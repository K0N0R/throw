import io from 'socket.io';
import uuid from 'uuid';
import { User } from './user';
import { Game } from './../game/game';
import { Team } from '../../shared/team';
import { ILobbyRoom, ILobbyRoomListItem, IGameState } from './../../shared/events';

type Message = {
    nick: string;
    avatar: string;
    value: string;
} | null

export class Room {
    public id: string;
    public users: User[] = [];
    public time: number = 0; // in seconds
    public timeLimit = 6;
    public timeInterval: any;
    public scoreLimit = 10;
    private score!: {
        left: number;
        right: number;
    };
    private goldenScore!: boolean;
    public lastMessage!: Message;
    private game!: Game | null;
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
        user.socket.emit('room::joined', this.getData());
        this.onUserJoins(user);
    }

    private onUserJoins(user: User): void {
        user.socket.on('room::user-created-game', () => this.onUserCreateGame(user));
        user.socket.on('room::update', (lobbyRoom: ILobbyRoom) => this.update(lobbyRoom, user));
        user.socket.on('room::leave', () => this.userLeaves(user));
        user.onDisconnect('room::user-disconnect', () => this.userLeaves(user));
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
        user.offDisconnect('room::user-disconnect');
    }

    private notifyChange(): void {
        this.io.to(this.id).emit('room::changed', this.getData());
        this.onNotify();
    }

    public getListData(): ILobbyRoomListItem {
        return {
            id: this.id,
            name: this.name,
            playing: this.game != null,
            players: this.users.length,
        };
    }

    public getData(): ILobbyRoom {
        const mapUser = (user: User) => ({
                socketId: user.socket.id,
                nick: user.nick,
                avatar: user.avatar,
                team: user.team
            });
        return {
            ...this.getListData(),
            adminId: this.adminId,
            users: this.users.map(mapUser),
            timeLimit: this.timeLimit,
            scoreLimit: this.scoreLimit,
            lastMessage: this.lastMessage
        }
    }

    public update(room: ILobbyRoom, user: User): void {
        if (user.socket.id === this.adminId) {
            this.adminId = room.adminId;
            this.timeLimit = Number(room.timeLimit);
            this.scoreLimit = Number(room.scoreLimit);
            // react on data change
            let usersChanged = this.users.length !== room.users.length;
            this.users.forEach(thisUser => {
                const dataUser = room.users.find(item => item.socketId === thisUser.socket.id);
                if (!user) {
                    usersChanged = true;
                } else if (thisUser.team !== dataUser?.team) {
                    usersChanged = true;
                    thisUser.team = dataUser?.team ?? Team.Spectator;
                }
            });
            if (room.playing && !this.game) {
                this.startGame();
            } else if(!room.playing && this.game) {
                this.stopGame();
                this.stopTime();
                this.resetScore();
            } else if (room.playing && usersChanged) {
                this.game?.updatePlayers(this.users);
            }

            this.lastMessage = room.lastMessage as Message;
            this.notifyChange();
            // clear temporary data - only for one notify
            this.lastMessage = null;
        }

        this.lastMessage = room.lastMessage as Message;
        this.notifyChange();
        // clear temporary data - only for one notify
        this.lastMessage = null;
    }

    //#region game
    private onUserCreateGame(user: User): void {
        if (this.game != null) {
            user.socket.emit('room::game-data', this.game.getGameData());
        }
    }

    public startGame(): void {
        this.game = new Game(this.io, this.users, this.id,
            () => { this.stopTime() },
            () => { this.startTime() },
            (team: Team) => { this.updateScore(team) });

        this.resetTime();
        this.resetScore();
        this.gameInterval = setInterval(() => {
            if (this.game) this.game.run();
        }, 0);
        this.onGameStateChange();
    }

    public stopGame(): void {
        clearInterval(this.gameInterval);
        if (this.game) this.game.dispose();
        this.game = null;
        this.resetTime();
        this.resetScore();
    }

    private getGameState(gameState?: {teamWhoScored?: Team, teamWhoWon?: Team}): IGameState {
        return {
            time: this.time,
            score: {
                left: this.score.left,
                right: this.score.right
            },
            goldenScore: this.goldenScore,
            teamWhoScored: gameState?.teamWhoScored ?? void 0,
            teamWhoWon: gameState?.teamWhoWon ?? void 0
        }
    }

    private onGameStateChange(gameState?: {teamWhoScored?: Team, teamWhoWon?: Team}): void {
        this.io.to(this.id).emit('game::state', this.getGameState(gameState))
    }
    //#endregion

    //#region time
    private startTime(): void {
        this.timeInterval = setInterval(() => {
            this.time+=1;
            if (this.time >= this.timeLimit * 60) {
                if (this.score.left !== this.score.right) {
                    const teamWhoWon = this.score.left > this.score.right
                        ? Team.Left : Team.Right;
                    this.onGameStateChange({ teamWhoWon });
                    this.stopGame();
                    this.notifyChange();
                    
                } else {
                    this.goldenScore = true;
                    this.onGameStateChange();
                }
            } else {
                this.onGameStateChange();
            }
        }, 1000);
    }

    private stopTime(): void {
        clearInterval(this.timeInterval);
    }

    private resetTime(): void {
        this.time = 0;
        clearInterval(this.timeInterval);
    }

    private updateScore(teamWhoScored: Team): void {
        if (Team.Left === teamWhoScored) {
            this.score.left = this.score.left+1;
        } else {
            this.score.right = this.score.right+1;
        }
        let teamWhoWon = this.goldenScore ? teamWhoScored : void 0;
        if (this.score.left === this.scoreLimit) teamWhoWon = Team.Left;
        if (this.score.right === this.scoreLimit) teamWhoWon = Team.Right;
        this.onGameStateChange({ teamWhoScored, teamWhoWon });
        if (teamWhoWon != null) {
            this.stopGame();
            this.notifyChange();
        }
    }

    private resetScore(): void {
        this.score = {
            left: 0,
            right: 0
        };
        this.goldenScore = false;
    }


    //#endregion
}