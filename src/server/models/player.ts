import * as p2 from 'p2';

import { calculateVectorLength, normalizeVector } from './../../shared/vector';
import { Keys } from './../../shared/keys';
import { player_config } from './../../shared/callibration';
import { Team } from './../../shared/team';
import { IPlayerKey } from './../../shared/events';

import { MAP_BORDER, PLAYER, BALL, GOAL_POST } from './collision';

export class Player {
    public socketId: string;
    public body!: p2.Body;
    private shape!: p2.Circle;
    public keyMap: IPlayerKey = {};

    public shooting!: boolean;
    public sprinting!: boolean;

    public get maxSpeed(): number {
        return this.sprinting
            ? player_config.sprintMaxSpeed
            : player_config.maxSpeed
    } 
    public team: Team

    public constructor(socketId: string, material: p2.Material) {

        this.socketId = socketId;
        let options: p2.BodyOptions = {
            mass: player_config.mass,
            position: [0, 0],
            velocity: [0, 0],
        };
        this.body = new p2.Body(options);
        this.shape = new p2.Circle({
            radius: player_config.radius,
            collisionGroup: PLAYER,
            collisionMask: PLAYER | MAP_BORDER | BALL | GOAL_POST 
        });
        this.shape.material = material;
        this.body.addShape(this.shape);
        this.body.damping = player_config.damping;
    }

    public onMovmentChange(): void {
        const moveVector = { x: this.body.force[0], y: this.body.force[1] };
        const movmentLength = calculateVectorLength(moveVector);
        if (movmentLength > this.maxSpeed) {
            const normalizedMoveVector = normalizeVector(moveVector);
            this.body.force[0] = normalizedMoveVector.x * this.maxSpeed;
            this.body.force[1] = normalizedMoveVector.y * this.maxSpeed;
        }
    }
    public counter = 0;
    public logic(): void {
        for (let key in this.keyMap) {
            switch (Number(key)) {
                case Keys.Up:
                    if (this.keyMap[key])  this.body.force[1] = -this.maxSpeed;
                    break;
                case Keys.Down:
                    if (this.keyMap[key]) this.body.force[1] = +this.maxSpeed;
                    break;
                case Keys.Left:
                    if (this.keyMap[key]) this.body.force[0] = -this.maxSpeed;
                    break;
                case Keys.Right:
                    if (this.keyMap[key]) this.body.force[0] = +this.maxSpeed;
                    break;
                case Keys.Shift:
                    this.sprinting = this.keyMap[key];
                    break;
                case Keys.X:
                    this.shooting = this.keyMap[key];
                    break;
            }
        }
        this.onMovmentChange();
    }
}