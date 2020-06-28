import { ISize } from './model';
import { Camera } from './../client/models/camera';

const scale = 1;

//#region MAP CONFIG
export enum MapKind {
    ROUNDED = 'ROUNDED',
    ROUNDED_MEDIUM = 'ROUNDED_MEDIUM',
    ROUNDED_BIG = 'ROUNDED_BIG'
}

interface IMapConfigValue {
    size: ISize;
    outerSize: ISize,
    cornerPointsAmount: number;
    cornerRadius: number;
    middleRadius: number;
    border: number;
    goal: {
        size: ISize;
        postRadius: number;
        cornerPointsAmount: number;
        cornerRadius: number;
    },
    ball: {
        radius: number;
    },
    player: {
        radius: number;
    }
}

interface IMapConfig {
    [MapKind.ROUNDED]: IMapConfigValue;
    [MapKind.ROUNDED_MEDIUM]: IMapConfigValue;
    [MapKind.ROUNDED_BIG]: IMapConfigValue;
}

const generateMapConfig: () => IMapConfig = () => {
    const config = {
        [MapKind.ROUNDED]: {
            height: 586,
            width: 1280,
            goal: {
                height: 220,
                width: 65,
            },
            ball: {
                radius: 17.5
            },
            player: {
                radius: 25,
            }
        },
        [MapKind.ROUNDED_MEDIUM]: {
            height: 586 * 1.2,
            width: 1280 * 1.2,
            goal: {
                height: 220 * 1.1,
                width: 65,
            },
            ball: {
                radius: 17.5
            },
            player: {
                radius: 25,
            }
        },
        [MapKind.ROUNDED_BIG]: {
            height: 586 * 1.5,
            width: 1280 * 1.5,
            goal: {
                height: 220 * 1.2,
                width: 65,
            },
            ball: {
                radius: 17.5
            },
            player: {
                radius: 25,
            }
        },
    }
    let enumMapSizes: any = {};
    for (let key in config) {
        if (!config[key]) return;
        const border = config[key].goal.width * 2 * scale;
        enumMapSizes[key] = {
            goal: {
                size: {
                    height: config[key].goal.height * scale,
                    width: config[key].goal.width * scale,
                },
                postRadius: 13 * scale,
                cornerRadius: config[key].goal.width * scale * 0.5,
                cornerPointsAmount: 10 * scale,
            },
            ball: {
                radius: config[key].ball.radius * scale
            },
            player: {
                radius: config[key].player.radius * scale
            },
            size: {
                height: config[key].height * scale,
                width: config[key].width * scale
            },
            outerSize: {
                height: (config[key].height * scale) + border * 2,
                width: (config[key].width * scale) + border * 2
            },
            border: border,
            cornerPointsAmount: 16 * scale,
            cornerRadius: config[key].height / 6 * scale,
            middleRadius: config[key].height / 5 * scale,
        }
    }
    return enumMapSizes;
}
export const map_config = generateMapConfig();

export enum CameraKind {
    Close = 'Close',
    Medium = 'Medium',
    Far = 'Far'
}
const cameraBaseSize: ISize = {
    width: 1280,
    height: 586
}

export const game_config = {
    goalResetTimeout: 3000,
    endGameResetTimeout: 8000,
    interval: 1000/60,
    camera: {
        [CameraKind.Close]: {
            width: cameraBaseSize.width * 1.1,
            height: cameraBaseSize.height * 1.1
        },
        [CameraKind.Medium]: {
            width: cameraBaseSize.width * 1.3,
            height: cameraBaseSize.height * 1.3
        },
        [CameraKind.Far]: {
            width: cameraBaseSize.width * 1.5,
            height: cameraBaseSize.height * 1.5
        }
    },
    ball: {
        mass: 1,
        damping: 0.5
    },
    player: {
        mass: 5,
        damping: 0.92,
        movementSpeed: 3000 * scale,
        shootingMovementSpeed: 1750 * scale,
        shooting: 125000 * scale,
        shootingCooldown: 100,
        dashing: 1250,
        dashDuration: 200,
        dashCooldown: 6000,
    }
}

//#region style
export const style_config = {
    map: {
        strokeStyle: '#c7e6bd',
        lineWidth: 5 * scale,
    },
    ball: {
        fillStyle: 'white',
        strokeStyle: 'black',
        lineWidth: 3 * scale
    },
    goal: {
        strokeStyle: 'black',
        lineWidth: 3 * scale,
        postStrokeStyle: 'black',
        leftPostFillStyle: '#ffcccc',
        rightPostFillStyle: '#ccccff',
        postLineWidth: 3 * scale
    },
    player: {
        leftFillStyle: '#e56e56',
        rightFillStyle: '#5689e5',
        strokeStyle: 'black',
        shootingStrokeStyle: 'white',
        lineWidth: 3 * scale,
        meIndicatorStrokeStyle: '#FFFFFF',
        meIndicatorLineWidth: 5 * scale,
        meIndicatorRadius: 40 * scale
    }
}
//#endregion
