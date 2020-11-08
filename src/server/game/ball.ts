import p2 from 'p2';
import { game_config, map_config, MapKind } from './../../shared/callibration';
import { BALL, MAP, GOAL, PLAYER, GOAL_POST, GOAL_SCORE } from './collision';

export class Ball {
    public body: p2.Body;
    private shape: p2.Circle;

    public constructor(private mapKind: MapKind, material: p2.Material ) {
        this.body = new p2.Body({
            mass: game_config.ball.mass,
            position: [
                map_config[this.mapKind].outerSize.width / 2,
                map_config[this.mapKind].outerSize.height / 2
            ],
        });

        this.shape = new p2.Circle({
            radius: map_config[this.mapKind].ball.radius,
            collisionGroup: BALL,
            collisionMask: MAP | GOAL | PLAYER | GOAL_POST | GOAL_SCORE
        });

        this.shape.material = material;
        this.body.addShape(this.shape);
        this.body.damping = game_config.ball.damping;
    }
}
