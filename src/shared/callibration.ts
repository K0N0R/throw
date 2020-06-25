const scale = 2;
export const game_config = {
    goalResetTimeout: 3000,
    endGameResetTimeout: 7000,
    interval: 1000/60
}

export const ball_config = {
    radius: 17.5 * scale,
    mass: 1,
    damping: 0.5
}

export const ball_style = {
    fillStyle: 'white',
    strokeStyle: 'black',
    lineWidth: 3 * scale
}

export const goal_config = {
    size: { height: 220 * scale, width: 50 * scale },
    postRadius: 13 * scale,
    cornerRadius: 30 * scale,
    cornerPointsAmount: 10 * scale,
}

export const goal_style = {
    strokeStyle: 'black',
    lineWidth: 3 * scale,
    postStrokeStyle: 'black',
    leftPostFillStyle: '#ffcccc',
    rightPostFillStyle: '#ccccff',
    postLineWidth: 3 * scale
}

const mapSize = { height: 586 * scale, width: 1280 * scale };
const mapBorder = 2*goal_config.size.width; 
export const map_config = {
    size: { height: mapSize.height, width: mapSize.width },
    outerSize: { height: (mapSize.height + (2*mapBorder)), width: (mapSize.width + (2*mapBorder))},
    cornerPointsAmount: 16 * scale,
    cornerRadius: mapSize.width / 10,
    border: mapBorder,
    middleRadius: mapSize.height/4
}

export const canvas_config = {
    size: { width: (mapSize.width + (2 * mapBorder)), height: (mapSize.height + (2*mapBorder)) }
}

export const map_style = {
    strokeStyle: '#c7e6bd',
    lineWidth: 5 * scale,
}

export const player_config = {
    radius: 25 * scale,
    mass: 5,
    damping: 0.92,
    shootingMaxSpeed: 1750 * scale,
    maxSpeed: 2750 * scale,
    shooting: 125000 * scale,
    shootingCooldown: 100,
    dashing: 1250,
    dashDuration: 200,
    dashCooldown: 6000,
    dashMaxSpeed: 8000 * scale
}

export const player_style = {
    leftFillStyle: '#e56e56',
    rightFillStyle: '#5689e5',
    strokeStyle: 'black',
    shootingStrokeStyle: 'white',
    lineWidth: 3 * scale,
    meIndicatorStrokeStyle: '#FFFFFF',
    meIndicatorLineWidth: 5 * scale,
    meIndicatorRadius: 40 * scale
}
