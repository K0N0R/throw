import { Team } from "./team";
import { User } from './../server/lobby/user';
import { MapKind } from "./callibration";
//#region PLAYER
export interface IPlayerAdd {
    nick: string;
    avatar: string;
    socketId: string;
    team: Team;
    position: [number, number];
}

export interface IRoomGameData {
    players: IPlayerAdd[];
    ball: {
        position: [number, number];
    };
}

export interface IPlayerShooting {
    socketId: string;
    shooting: boolean;
}

export interface IPlayerDispose {
    socketId: string;
}
//#endregion

//#region BALL

//#endregion

//#region WORLD
export interface IWorldReset {
    players: {
        socketId: string;
        position: [number, number];
    }[];
    ball: {
        position: [number, number];
    };
}

export interface IWorldPostStep {
    playersToAdd?: IPlayerAdd[];
    playersToRemove?: string[];
    playersShooting?: { socketId: string; shooting: boolean }[];
    playersMoving?: {
        socketId: string;
        position: [number, number];
    }[];
    ballMoving?: { position: [number, number] } | null;
}
//#endregion

//#region lobby
export interface IConnectionData {
    nick: string;
    avatar: string;
}

export interface IRoom {
    id: string;
    adminId: string;
    name: string;
}

export interface IRoomState {
    room: IRoom;
    users: IRoomUser[];
    gameParams: IRoomGameParams;
    gameState: IRoomGameState;
    gameRunning: boolean;
    gameScoreboard: IRoomGameScoreboardItem[];
}

export interface IRoomGameParams {
    timeLimit?: number;
    scoreLimit: number;
    mapKind?: MapKind;
}

export interface IRoomUser {
    socketId: string;
    nick: string;
    avatar: string;
    afk: boolean;
    team: Team;
}

export interface IRoomMessage {
    nick: string;
    avatar: string;
    value: string;
}

export interface IRoomGameState {
    time: number;
    left: number;
    right: number;
    golden: boolean;
}

export interface IRoomGameScore {
    team: Team;
    scorer?: IRoomUser;
}

export interface IRoomGameScoreboardItem {
    scorer: IRoomUser;
    goals: number;
    ownGoals: number;
}

export interface IRoomCreate {
    name: string;
    password: string;
    maxPlayersAmount: number;
}

export interface IRoomJoin {
    id: string;
    password: string;
}
//#endregion