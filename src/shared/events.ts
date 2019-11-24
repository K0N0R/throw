import { Team } from "./team";
//#region PLAYER
export interface IPlayerAdd {
    socketId: string;
    team: Team;
    position: [number, number];
}

export interface IPlayerInit {
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
    shootingWeak?: boolean;
    shootingStrong?: boolean;
}

export interface IPlayerMove {
    socketId: string;
    position: [number, number];
}

export interface IPlayerDispose {
    socketId: string;
}
//#endregion

//#region BALL
export interface IBallMove {
    position: [number, number];
}
//#endregion

//#region SCORE
export interface IScoreLeft {
    left: number;
}

export interface IScoreRight {
    right: number;
}
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
//#endregion