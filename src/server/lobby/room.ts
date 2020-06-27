import io from 'socket.io';
import uuid from 'uuid';
import { User } from './user';
import { Game } from './../game/game';
import { Team } from '../../shared/team';
import { ILobbyRoom, ILobbyRoomListItem, IGameState, IRoomDataMessage } from './../../shared/events';
import { game_config, MapKind } from './../../shared/callibration';

export class Room {
    public id: string;
    public users: User[] = [];

    private game!: Game | null;
    private gameInterval: any;
    private gameHasEnded: boolean = false;

    public time: number = 0; // in seconds
    public timeLimit = 6;
    public timeInterval: any;

    public scoreLimit = 10;
    private scoreLeft: number = 0;
    private scoreRight: number = 0;
    private scoreGolden: boolean = false;

    private mapKind: MapKind = MapKind.ROUNDED_MEDIUM;

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

    //#region user
    public userJoins(user: User): void {
        const idx = this.users.indexOf(user);
        if (idx !== -1) return;

        user.socket.join(this.id);
        user.team = Team.Spectator;
        this.users.push(user);
        this.onUsersChange();
        this.sendMessage({
            nick: '',
            avatar: 'SYSTEM',
            value: `${user.avatar}${user.nick} joined the room! :)`
        });

        user.socket.emit('room::user-joined', this.getData());

        user.socket.on('room::user-message', (message: IRoomDataMessage) => this.sendMessage(message));
        user.socket.on('room::update', (lobbyRoom: ILobbyRoom) => this.updateRoom(lobbyRoom, user));
        user.socket.on('room::user-leave', () => this.onUserLeave(user));
        user.onDisconnect('room::user-disconnect', () => this.onUserLeave(user));

        user.socket.on('game::player-joins', () => this.onUserJoinsGame(user));
    }

    public onUsersChange(): void {
        this.notifyChange();
        this.game?.updatePlayers(this.users);
    }

    private onUserLeave(user: User): void {
        if (user.socket.id === this.adminId) { // admin of room leave
            this.io.to(this.id).emit('room::destroyed');
            this.disposeGame();
            this.users.forEach(user => this.kickUser(user));
            this.onUsersChange();
            this.onDestroy();
        } else { // user of room leave
            this.kickUser(user);
            this.onUsersChange();
            this.sendMessage({
                nick: '',
                avatar: 'SYSTEM',
                value: `${user.avatar}${user.nick} left the room! :(`
            });
            user.socket.emit('room::user-left');
        }
    }

    private kickUser(user: User): void {
        user.socket.leave(this.id);
        const idx = this.users.indexOf(user)
        if (idx !== -1) this.users.splice(idx, 1);
        user.socket.removeAllListeners('game::player-joins');
        user.socket.removeAllListeners('room::update');
        user.socket.removeAllListeners('room::user-message');
        user.socket.removeAllListeners('room::user-leave');
        user.offDisconnect('room::user-disconnect');
    }
    //#endregion

    //#region message
    public sendMessage(message: IRoomDataMessage): void {
        this.io.to(this.id).emit('room::new-message', message);
    }
    //#endregion

    //#region notify
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
            mapKind: this.mapKind,
        }
    }

    public updateRoom(room: ILobbyRoom, user: User): void {
        if (user.socket.id === this.adminId) {
            this.adminId = room.adminId;
            this.timeLimit = Number(room.timeLimit);
            this.scoreLimit = Number(room.scoreLimit);
            this.mapKind = room.mapKind;
        }
        let usersChanged = this.users.length !== room.users.length;
        this.users.forEach(thisUser => {
            const dataUser = room.users.find(item => item.socketId === thisUser.socket.id);
            if (!dataUser) {
                usersChanged = true;
            } else if (thisUser.team !== dataUser?.team) {
                usersChanged = true;
                thisUser.team = dataUser?.team ?? Team.Spectator;
            }
        });

        // react on data change
        if (room.playing && !this.game) {
            this.createGame();
        } else if(!room.playing && this.game) {
            this.disposeGame();
        } else if (room.playing && usersChanged) {
            this.game?.updatePlayers(this.users);
        }

        this.notifyChange();
    }
    //#endregion

    //#region game
    public createGame(): void {
        this.gameHasEnded = false;
        this.game = new Game(this.io, this.mapKind, this.users, this.id,
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
    

    public disposeGame(): void {
        clearInterval(this.gameInterval);
        if (this.game) this.game.dispose();
        this.game = null;
        this.resetTime();
        this.resetScore();
    }

    private endGame(teamWhoWon: Team): void {
        this.sendMessage({
            nick: '',
            avatar: 'SYSTEM',
            value: `${teamWhoWon === Team.Left ? 'Red' : 'Blue' } team won the game!`
        });
        this.stopTime();
        this.game?.endGame();
        this.gameHasEnded = true;
        setTimeout(() => {
            this.disposeGame();
            this.notifyChange();
        }, game_config.endGameResetTimeout);
    }

    private onUserJoinsGame(user: User): void {
        if (!this.game) return;
        user.socket.emit('game::init-data', this.game.getGameData());
    }

    private onGameStateChange(gameState?: {teamWhoScored?: Team, teamWhoWon?: Team}): void {
        this.io.to(this.id).emit('game::state', this.getGameState(gameState))
    }

    private getGameState(gameState?: {teamWhoScored?: Team, teamWhoWon?: Team}): IGameState {
        return {
            time: this.time,
            scoreRight: this.scoreRight,
            scoreLeft: this.scoreLeft,
            scoreGolden: this.scoreGolden,
            teamWhoScored: gameState?.teamWhoScored ?? void 0,
            teamWhoWon: gameState?.teamWhoWon ?? void 0
        }
    }

    private startTime(): void {
        this.timeInterval = setInterval(() => {
            this.time += 1;
            if (this.time >= this.timeLimit * 60) {
                if (this.scoreLeft !== this.scoreRight) {
                    const teamWhoWon = this.scoreLeft > this.scoreRight
                        ? Team.Left : Team.Right;
                    this.onGameStateChange({ teamWhoWon });
                     this.endGame(teamWhoWon);
                } else {
                    this.scoreGolden = true;
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
        if (this.gameHasEnded) return;
        if (Team.Left === teamWhoScored) {
            this.scoreLeft += 1;
        } else {
            this.scoreRight += 1;
        }
        let teamWhoWon = this.scoreGolden ? teamWhoScored : void 0;
        if (this.scoreLeft >= this.scoreLimit) teamWhoWon = Team.Left;
        if (this.scoreRight >= this.scoreLimit) teamWhoWon = Team.Right;
        this.onGameStateChange({ teamWhoScored, teamWhoWon });
        if (teamWhoWon != null) {
            this.endGame(teamWhoWon);
        }
    }

    private resetScore(): void {
        this.scoreRight = 0;
        this.scoreLeft = 0;
        this.scoreGolden = false;
    }
    //#endregion
}