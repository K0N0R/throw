import { h, Component } from 'preact';

import { Game } from '../models/game';

import { KeysHandler } from './../../shared/keysHandler'
import { ILobbyRoom, IGameState } from '../../shared/events';
import { Socket } from './../models/socket';

interface IGamePageState {
    room: ILobbyRoom;
    gameAnimFrame: number;
    gameKeysInterval: NodeJS.Timeout;
    game: Game | null;
    score: {
        left: number;
        right: number;
    }
    goldenScore?: boolean;
    time: number;
}

export default class GamePage extends Component<{ room: ILobbyRoom}, IGamePageState> {

    componentDidMount() {
        this.setState({ room: this.props.room, score: { left: 0, right: 0 }, time: 0 });
        this.onRoomChange(this.props.room);
        this.forceUpdate();
        Socket.onRoomJoined((room) => this.onRoomChange(room), () => this.onRoomDestroy() );
        Socket.onGameJoined((gameState: IGameState) => this.onGameStateChange(gameState));
    }

    componentWillUnmount() {

    }

    onRoomChange(newValue: ILobbyRoom): void {
        if (newValue.playing && !this.state.game) {
            this.startGame();
        } else if(!newValue.playing && this.state.game) {
            this.breakGame();
        }
    }

    onRoomDestroy(): void {
        this.breakGame();
    }

    breakGame(): void {
        cancelAnimationFrame(this.state.gameAnimFrame);
        clearInterval(this.state.gameKeysInterval);
        if (this.state.game) {
            this.state.game.dispose();
            this.setState({ game: null});
        }
    }

    onGameStateChange(gameState: IGameState): void {
        this.setState({ goldenScore: gameState.goldenScore });
        this.setState({ score: gameState.score });
        this.setState({ time: gameState.time });
        this.forceUpdate();
    }

    startGame(): void {
        this.setState({ game: new Game()});
        const loop = () => {
            const gameAnimFrame = requestAnimationFrame(loop);
            this.setState({ gameAnimFrame: gameAnimFrame });
            if (this.state.game) {
                this.state.game.run();
            }
        }
        loop();
        const gameKeysInterval = setInterval(() => {
            KeysHandler.run();
        }, 4);
        this.setState({ gameKeysInterval });
    }

    showTime(): string {
        let minutes = Math.floor(this.state.time / 60).toString();
        if (minutes.length !== 2) minutes = `0${minutes}`;
        let seconds = (this.state.time % 60).toString();
        if (seconds.length !== 2) seconds = `0${seconds}`;
        return `${minutes}:${seconds}`;
    }

    render(_, state: IGamePageState) {
        if (!state.room) return;
        return (
            <div class="game-state">
                <div class="game-state__score">
                    <div class="game-state__score__value">
                        <div class="team-cube team-cube--left"></div>
                        <div>{state.score.left}</div>
                    </div>
                    <div>-</div>
                    <div class="game-state__score__value">
                        <div>{state.score.right}</div>
                        <div class="team-cube team-cube--right"></div>
                    </div>
                </div>
                <div class="game-state__time"
                    style={state.goldenScore ? 'color:gold;': ''}>
                    {this.showTime()}
                </div>
                <div class="game-state__golden"
                    style={state.goldenScore ? '': 'display:none'}>
                    🔔 Golden goal!
                </div>
            </div>

        );
    }
}