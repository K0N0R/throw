import * as p2 from 'p2';

import { calculateVectorLength, normalizeVector, getNormalizedVector } from './../../shared/vector';
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

    public shootingCooldown: boolean;
    public shooting!: boolean;
    public dashing!: boolean;

    public get maxSpeed(): number {
        if (this.shooting) {
            return player_config.shootingMaxSpeed;
        }

        return player_config.maxSpeed;
    } 
    public team: Team

    public constructor(socketId: string, public name: string, public avatar: string, material: p2.Material) {

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

    public shoot(): void {
        this.shootingCooldown = true;
        setTimeout(() => {
            this.shootingCooldown = false;
        }, player_config.shootingCooldown);
    }

    public dash(): void {
        if (!this.dashing) {
            this.dashing = true;
            const initVelocity = {x: this.body.velocity[0], y: this.body.velocity[1]};
            const dashingVector = getNormalizedVector(
                { x: this.body.position[0], y: this.body.position[1] },
                { x: this.body.position[0] + initVelocity.x, y: this.body.position[1] + initVelocity.y }
            ); 
            this.body.velocity[0] = (dashingVector.x * player_config.dashing);
            this.body.velocity[1] = (dashingVector.y * player_config.dashing);
            setTimeout(() => {
                this.body.velocity[0] = initVelocity.x;
                this.body.velocity[1] = initVelocity.y;
                setTimeout(() => {
                    this.dashing = false;
                }, player_config.dashCooldown)
            }, player_config.dashDuration);
        }
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
        const direction = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        for (let key in this.keyMap) {
            switch (Number(key)) {
                case Keys.Up:
                    if (this.keyMap[key]) {
                        this.body.force[1] = -this.maxSpeed;
                        direction.up = true;
                    }
                    break;
                case Keys.Down:
                    if (this.keyMap[key]) {
                        this.body.force[1] = +this.maxSpeed;
                        direction.down = true;
                    }
                    break;
                case Keys.Left:
                    if (this.keyMap[key]) {
                        this.body.force[0] = -this.maxSpeed;
                        direction.left = true;
                    }
                    break;
                case Keys.Right:
                    if (this.keyMap[key]) {
                        this.body.force[0] = +this.maxSpeed;
                        direction.right = true;
                    }
                    break;
                case Keys.X:
                    this.shooting = this.keyMap[key];
                    break;
            }
        }
        for (let key in this.keyMap) {
            switch (Number(key)) {
                case Keys.Shift:
                    if  (this.keyMap[key]) {
                        if (direction.up || direction.down || direction.left || direction.right) {
                            this.dash();
                        }
                    }
                    break;
            }
        }
        this.onMovmentChange();
    }
}