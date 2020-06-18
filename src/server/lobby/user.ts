import io from 'socket.io';

export class User {
    public constructor(
        public socket: io.Socket,
        public nick: string,
        public avatar: string) {
    }
}