import { Socket } from 'socket.io';
import { Team } from '../../shared/team';

export class User {
    public afk = false;
    public team: Team = Team.Spectator;

    public constructor(
        public socket: Socket,
        public nick: string,
        public avatar: string) {
        this.socket.on('disconnect', () => {
            this.onDisconnectCallbacks.forEach(item => {
                item.callback();
            })
            this.socket.removeAllListeners('disconnect');
        });
    }

    public onDisconnectCallbacks: { eventId: string, callback: () => void }[] = []
    public onDisconnect(eventId: string, callback: () => void): void {
        this.onDisconnectCallbacks.push({ eventId, callback });
    };

    public offDisconnect(eventId: string): void {
        const idx = this.onDisconnectCallbacks.findIndex(item => item.eventId === eventId);
        if (idx !== -1) {
            this.onDisconnectCallbacks.splice(idx, 1);
        }
    }
}
