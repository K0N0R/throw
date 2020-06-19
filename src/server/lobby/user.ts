import io from 'socket.io';
import { Team } from '../../shared/team';

export class User {
    public team: Team = Team.Spectator;
    public constructor(
        public socket: io.Socket,
        public nick: string,
        public avatar: string) {
    }
}