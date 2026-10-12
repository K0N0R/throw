import { Bus } from './bus';

type TGameState = 'initialization' | 'lobby' | 'gameplay';

export class GameStateBase {
    state: TGameState = 'initialization';

    goToLobby() {
        this.state = 'lobby';
        Bus.emit('state', { name: 'lobby-start' });
    }

    goToGameplay() {
        this.state = 'gameplay';
        Bus.emit('state', { name: 'gameplay-start' });
    }

    update(deltaMS: number) {}
}
export const GameState = new GameStateBase();
