import { Team } from "./team";
import { User } from './../server/lobby/user';
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
    score: {
        left: number;
        right: number;
    }
}

export interface IPlayerKey {
    [param: number]: boolean;
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
    scoreRight?: number | null;
    scoreLeft?: number | null;
    teamWhoScored?: Team | null;
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

export interface ILobbyRoom {
    id: string;
    name: string;
    players: number;
    playing: boolean;
    data?: IRoomData;
}

export interface IRoomData {
    adminId: string;
    users: { socketId: string, nick: string, avatar: string; team: Team}[]
    timeLimit: number;
    scoreLimit: number;
    lastMessage?: IRoomDataMessage | null
}

export interface IRoomDataMessage {
    nick: string;
    avatar: string;
    value: string;
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