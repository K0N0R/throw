import p2 from 'p2';

import { calculateVectorLength, normalizeVector, getNormalizedVector } from './../../shared/vector';
import { game_config, map_config, MapKind } from './../../shared/callibration';
import { Team } from './../../shared/team';

import { MAP_BORDER, PLAYER, BALL, GOAL_POST } from './collision';
import { IPos } from './../../shared/model';
import { User } from './../lobby/user';
import { KeysMap } from './../../shared/keysHandler';

export class Player {
    public body!: p2.Body;
    private shape!: p2.Circle;
    public keysMap: Partial<KeysMap> = {};

    public shootingCooldown!: boolean;
    public shooting!: boolean;

    public get maxSpeed(): number {
        if (this.shooting) {
            return game_config.player.shootingMovementSpeed;
        }
        return game_config.player.movementSpeed;
    } 

    public constructor(
        private mapKind: MapKind,
        public user: User,
        public nick: string,
        public avatar: string,
        public team: Team, 
        material: p2.Material,
        initPos: IPos) {

        let options: p2.BodyOptions = {
            mass: game_config.player.mass,
            position: [initPos.x, initPos.y],
            velocity: [0, 0],
        };
        this.body = new p2.Body(options);
        this.shape = new p2.Circle({
            radius: map_config[this.mapKind].player.radius,
            collisionGroup: PLAYER,
            collisionMask: PLAYER | MAP_BORDER | BALL | GOAL_POST 
        });
        this.shape.material = material;
        this.body.addShape(this.shape);
        this.body.damping = game_config.player.damping;
    }

    public shoot(): void {
        this.shootingCooldown = true;
        setTimeout(() => {
            this.shootingCooldown = false;
        }, game_config.player.shootingCooldown);
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
        
        if (this.keysMap.up) {
            this.body.force[1] = -this.maxSpeed;
        }
        if (this.keysMap.down) {
            this.body.force[1] = +this.maxSpeed;
        }
        if (this.keysMap.left) {
            this.body.force[0] = -this.maxSpeed;
        }
        if (this.keysMap.right) {
            this.body.force[0] = +this.maxSpeed;
        }
        this.shooting = Boolean(this.keysMap.shoot);

        this.onMovmentChange();
    }
}