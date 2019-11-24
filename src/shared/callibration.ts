
export const game_config = {
    goalResetTimeout: 3000,
}

export const ball_config = {
    radius: 17.5,
    mass: 1,
    damping: 0.03
}

export const ball_style = {
    fillStyle: 'white',
    strokeStyle: 'black',
    lineWidth: 3
}

export const goal_config = {
    size: { height: 220, width: 50 },
    postRadius: 13,
    cornerRadius: 30,
    cornerPointsAmount: 10,
}

export const goal_style = {
    strokeStyle: 'black',
    lineWidth: 3,
    postStrokeStyle: 'black',
    postFillStyle: '#D95A62',
    postLineWidth: 3
}

const mapSize = { height: 586, width: 1280 };
const mapBorder = 2*goal_config.size.width; 
export const map_config = {
    size: { height: mapSize.height, width: mapSize.width },
    outerSize: { height: mapSize.height + 2*mapBorder, width: mapSize.width + 2*mapBorder},
    cornerPointsAmount: 16,
    cornerRadius: mapSize.width / 10,
    border: mapBorder
}

export const canvas_config = {
    size: { width: mapSize.width + 2 * mapBorder, height: mapSize.height + 2*mapBorder }
}

export const map_style = {
    strokeStyle: 'white',
    lineWidth: 3,
}

export const player_config = {
    radius: 25,
    mass: 2,
    damping: 0.15,
    movementIncrease: 0.18,
    sprintMovementIncrease: 0.25,
    maxSpeed: 15,
    sprintMaxSpeed: 20,
    shootingStrong: 25,
    shootingWeak: 12.5,
    sprinting: 2000,
    sprintingCooldown: 4000
}

export const player_style = {
    leftFillStyle: '#8F1218',
    rightFillStyle: '#4663A0',
    strokeStyle: 'black',
    shootingStrokeStyle: 'white',
    lineWidth: 3,
    sprintingCooldownPlusRadius: 6,
    sprintingCooldownFillStyle: '#80FFFFFF'
}
