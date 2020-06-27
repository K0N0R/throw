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

export interface ILobbyRoomListItem {
    id: string;
    name: string;
    players: number;
    playing: boolean;
}

export interface ILobbyUser {
    socketId: string;
    nick: string;
    avatar: string;
    afk: boolean;
    team: Team;
}
export interface ILobbyRoom extends ILobbyRoomListItem {
    id: string;
    name: string;
    players: number;
    playing: boolean;
    adminId: string;
    users: ILobbyUser[]
    timeLimit: number;
    scoreLimit: number;
    mapKind: MapKind;
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

export interface IGameState {
    teamWhoWon?: Team;
    teamWhoScored?: Team;
    scoreLeft: number;
    scoreRight: number;
    scoreGolden: boolean;
    goldenScore?: boolean;
    time: number;
}
//#endregion