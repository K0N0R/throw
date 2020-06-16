import io from 'socket.io';
import uuid from 'uuid';
import { User } from './user';
import { Game, IGameConfig } from './../game/game';


export class Room {
    public id: string;
    public users: User[] = [];
    public constructor(
        public adminId: string,
        public name: string,
        public password: string,
        public maxPlayersAmount: number) {
        this.id = uuid();
    }

    public join(user: User) {
        this.users.push(user);
    }

    public startGame(config: IGameConfig, io: io.Server): void {
        const game = new Game(config, this.id);
        setInterval(() => {
            game.run();
        }, 0);
    }
}