import io from 'socket.io';
import uuid from 'uuid';
import { User } from './user';
import { Game } from './../game/game';
import { Team } from '../../shared/team';
import { IRoom, IRoomGameParams, IRoomUser, IRoomMessage, IRoomState, IRoomGameState, IRoomGameData, IRoomGameScoreboardItem } from './../../shared/events';
import { game_config, MapKind } from './../../shared/callibration';

export class Room {
    public id: string;
    public users: User[] = [];

    private game!: Game | null;
    private gameInterval: any;
    private gameInformInterval: any;
    private gameScoreboard: IRoomGameScoreboardItem[] = [];

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
        public adminUser: User,
        public name: string,
        public password: string,
        public maxPlayersAmount: number,
        private onNotify: () => void,
        private onDispose: () => void) {
        this.id = uuid();
        this.onCreate();
    }

    //#region admin
    public onCreate(): void {
        this.joinUser(this.adminUser);
        this.bindAdminEvents();
        this.onNotify();
    }

    private bindAdminEvents(): void {
        this.adminUser.onDisconnect('room::admin::disconnect', () => this.onAdminDisconnect());
        this.adminUser.socket.on('room::user::leave', () => this.onAdminLeave());
        this.adminUser.socket.on('room::user::change-team', (data: IRoomUser)  => this.onUserTeamChange(data));
        this.adminUser.socket.on('room::game::params', (data: IRoomGameParams) => this.onRoomGameParamsChanged(data));
        this.adminUser.socket.on('room::game::start', () => this.startGame());
        this.adminUser.socket.on('room::game::stop', () => this.disposeGame());
    }

    private unbindAdminEvents(): void {
        this.adminUser.offDisconnect('room::admin::disconnect');
        this.adminUser.socket.removeAllListeners('room::user::leave');
        this.adminUser.socket.removeAllListeners('room::game::params');
        this.adminUser.socket.removeAllListeners('room::user::change-team');
    }

    private disposeRoom(): void {
        this.io.to(this.id).emit('room::destroyed');
        this.unbindAdminEvents();
        this.disposeGame();
        this.disposeUsers();
        this.onDispose();
    }

    private onAdminDisconnect(): void {
        this.disposeRoom();
    }

    private onAdminLeave(): void {
        this.disposeRoom();
    }

    private onRoomGameParamsChanged(data: IRoomGameParams) {
        if (data.mapKind != null) {
            this.mapKind = data.mapKind;
        }
        if (data.scoreLimit != null) {
            this.scoreLimit = data.scoreLimit;
        }
        if (data.timeLimit != null) {
            this.timeLimit = data.timeLimit;
        }
        this.io.to(this.id).emit('room::game::params-state', this.getGameParams());
    }

    private onUserTeamChange(roomUser: IRoomUser): void {
        const user = this.users.find(user => user.socket.id === roomUser.socketId);
        if (!user) return;
        if (user.team !== roomUser.team) {
            user.team = roomUser.team;
            this.io.to(this.id).emit('room::user::changed-team', this.getRoomUser(user));

            this.game?.removePlayer(user);
            this.game?.addNewPlayer(user);
        }
    }
    //#endregion

    //#region user
    private disposeUsers(): void {
        const users = [...this.users];
        users.forEach(user => this.disposeUser(user));
    }

    private disposeUser(user: User): void {
        this.io.to(this.id).emit('room::user::left', this.getRoomUser(user));
        this.removeUser(user);
        this.onNewMessage({
            nick: '',
            avatar: 'SYSTEM',
            value: `${user.avatar}${user.nick} left the room! :(`
        });
    }

    public joinUser(user: User): void {
        const idx = this.users.indexOf(user);
        if (idx !== -1) return;
        this.addUser(user);
        this.io.to(this.id).emit('room::user::add', this.getRoomUser(user));
        user.socket.emit('room::user::joined', this.getRoomState());
        this.onNewMessage({
            nick: '',
            avatar: 'SYSTEM',
            value: `${user.avatar}${user.nick} joined the room! :)`
        });
        user.socket.join(this.id);
    }

    private addUser(user: User): void {
        console.log(user.nick);
        user.team = Team.Spectator;
        this.users.push(user);
        this.bindUserEvents(user);
    }

    private removeUser(user: User): void {
        const idx = this.users.indexOf(user)
        if (idx !== -1) this.users.splice(idx, 1);
        this.unbindUserEvents(user);
        this.game?.removePlayer(user);
    }

    private bindUserEvents(user: User): void {
        user.socket.on('room::game::user-joined', (value) => this.onUserJoinedGame(user))
        user.socket.on('room::user::afk', (value) => this.onUserAfk(user, value))
        user.socket.on('room::user::message', (message: IRoomMessage) => this.onNewMessage(message));
        if (this.adminUser !== user) {
            user.socket.on('room::user::leave', () => this.onUserLeave(user));
            user.onDisconnect('room::user::disconnect', () => this.onUserDisconnect(user))
        };
    }

    private unbindUserEvents(user: User): void {
        user.socket.leave(this.id);
        user.socket.removeAllListeners('room::user::message');
        if (this.adminUser !== user) {
            user.socket.removeAllListeners('room::user::leave');
            user.offDisconnect('room::user::disconnect');
        }
    }

    private onNewMessage(message: IRoomMessage): void {
        this.io.to(this.id).emit('room::user::messaged', message);
    }

    private onUserDisconnect(user: User): void {
       this.disposeUser(user);
    }

    private onUserLeave(user: User): void {
        this.disposeUser(user);
    }

    private onUserAfk(user: User, value: boolean): void {
        if (user.afk !== value) {
            user.afk = value;
            this.io.to(this.id).emit('room::user::afk-changed', this.getRoomUser(user));
        }
    }

    private onUserJoinedGame(user: User): void {
        user.socket.emit('room::game::init-data', this.getGameInitData());
    }
    //#endregion

    //#region mappings
    public getData(): IRoom {
        return {
            id: this.id,
            adminId: this.adminUser.socket.id,
            name: this.name,
        }
    }

    private getRoomState(): IRoomState {
        return {
            room: this.getData(),
            users: this.getRoomUsers(),
            gameParams: this.getGameParams(),
            gameState: this.getGameState(),
            gameRunning: this.game != null,
            gameScoreboard: this.gameScoreboard
        };
    }

    private getRoomUser(user: User): IRoomUser {
        return {
            socketId: user.socket.id,
            nick: user.nick,
            avatar: user.avatar,
            team: user.team,
            afk: user.afk
        };
    }

    private getRoomUsers(): IRoomUser[] {
        return this.users.map(this.getRoomUser);
    }

    private getGameParams(): IRoomGameParams {
        return {
            mapKind: this.mapKind,
            scoreLimit: this.scoreLimit,
            timeLimit: this.timeLimit
        };
    }

    private getGameState(): IRoomGameState {
        return {
            time: this.time,
            left: this.scoreLeft,
            right: this.scoreRight,
            golden: this.scoreGolden
        };
    }

    private getGameInitData(): IRoomGameData | undefined {
        return this.game?.getGameData();
    }
    //#endregion

    //#region game
    private resetGame(): void {
        clearInterval(this.gameInterval);
        clearInterval(this.gameInformInterval);
        this.game?.dispose();
        this.game = null;
        this.resetTime();
        this.resetScore();
        this.resetScoreboard();
    }

    private resetTime(): void {
        this.time = 0;
        clearInterval(this.timeInterval);
    }

    private resetScore(): void {
        this.scoreRight = 0;
        this.scoreLeft = 0;
        this.scoreGolden = false;
    }

    private resetScoreboard(): void {
        this.gameScoreboard = [];
    }

    private updateGameState(): void {
        this.io.to(this.id).emit('room::game::state', this.getGameState());
    }

    private updateGameWinner(): void {
        this.io.to(this.id).emit('room::game::winner', this.scoreLeft > this.scoreRight ? Team.Left : Team.Right);
    }

    private updateGameScoreboard(scorer: User, ownGoal: boolean): void {
        const gameScoreBoardItem = this.gameScoreboard.find(item => item.scorer.socketId === scorer.socket.id);
        if (gameScoreBoardItem) {
            if (ownGoal) {
                gameScoreBoardItem.ownGoals += 1;
            } else {
                gameScoreBoardItem.goals += 1;
            }

        } else {
            this.gameScoreboard.push({
                scorer: this.getRoomUser(scorer),
                goals: ownGoal ? 0 : 1,
                ownGoals: ownGoal ? 1 : 0
            })
        }
    }

    private updateGameScorer(team: Team, scorer?: User): void {
        if (scorer) {
            this.updateGameScoreboard(scorer, scorer?.team !== team);
        }
        this.io.to(this.id).emit('room::game::scorer', {
            team,
            scorer: scorer ? this.getRoomUser(scorer) : undefined
        });
    }

    public startGame(): void {
        this.io.to(this.id).emit('room::game::started');
        this.resetGame();
        this.game = new Game(this.io, this.id, this.mapKind, this.users,
            () => this.stopGameTime(),
            () => this.startGameTime(),
            (team: Team, user: User | undefined) => this.updateGameScore(team, user));

        this.gameInterval = setInterval(() => {
            if (this.game) this.game.run();
        }, 0);
        this.gameInformInterval = setInterval(() => {
            if (this.game) this.game.inform();
        }, 1000/60);
        this.updateGameState();
    }

    public disposeGame(): void {
        this.io.to(this.id).emit('room::game::stopped');
        this.resetGame();
    }

    private endGame(): void {
        this.updateGameWinner();
        this.stopGameTime();
        this.game?.endGame();
        setTimeout(() => {
            this.disposeGame();
        }, game_config.endGameResetTimeout);
    }

    private startGameTime(): void {
        this.timeInterval = setInterval(() => {
            this.onGameTimeChange();
        }, 1000);
    }

    private onGameTimeChange(): void {
        this.time += 1;
        if (this.time >= this.timeLimit * 60) {
            if (this.scoreLeft !== this.scoreRight) {
                this.endGame();
            } else {
                this.scoreGolden = true;
            }
        }
        this.updateGameState();
    }

    private stopGameTime(): void {
        clearInterval(this.timeInterval);
    }

    private updateGameScore(team: Team, scorer?: User): void {
        if (this.game?.disposing ?? false) return;
        if (Team.Left === team) {
            this.scoreLeft += 1;
        } else {
            this.scoreRight += 1;
        }
        let winningTeam = this.scoreGolden ? team : undefined;
        if (this.scoreLeft >= this.scoreLimit) winningTeam = Team.Left;
        if (this.scoreRight >= this.scoreLimit) winningTeam = Team.Right;
        this.updateGameScorer(team, scorer);
        this.updateGameState();
        if (winningTeam != null) {
            this.endGame();
        }
    }

    //#endregion
}
