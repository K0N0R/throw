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
    playersToAdd: IPlayerAdd[];
    playersToRemove: string[];
    scoreRight: number | null;
    scoreLeft: number | null;
    playersMoving: {
        socketId: string;
        position: [number, number];
    }[];
    ballMoving: { position: [number, number] } | null;
}
//#endregion