export const canvas_config = {
    size: { width: 1600, height: 1000 }
}

export const ball_config = {
    radius: 20,
    mass: 1,
    damping: 0.1
}

export const goal_config = {
    size: { height: 200, width: 50 },
    postRadius: 15,
    cornerRadius: 30,
    cornerPointsAmount: 5,
}

const mapSize = { height: 1000, width: 1600 };
const mapBorder = 2*goal_config.size.width; 
export const map_config = {
    size: { height: mapSize.height, width: mapSize.width },
    outerSize: { height: mapSize.height + 2*mapBorder, width: mapSize.width + 2*mapBorder},
    cornerPointsAmount: 16,
    cornerRadius: mapSize.width / 12,
    border: mapBorder
}

export const player_config = {
    radius: 25,
    mass: 2,
    damping: 0.5,
    movementIncrease: 2,
    sprintMovementIncrease: 4,
    maxSpeed: 20,
    sprintMaxSpeed: 36,
    shootingStrong: 100,
    shootingWeak: 50,
    sprinting: 2000,
    sprintingCooldown: 4000
}

// mozna tez tutaj dodać analogicznie player_style...