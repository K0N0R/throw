import { h, Component } from 'preact';

import { Game } from '../models/game';

import { KeysHandler } from './../../shared/keysHandler'
import { ILobbyRoom } from '../../shared/events';
import { Socket } from './../models/socket';

export default class GamePage extends Component<{ room: ILobbyRoom}, { room: ILobbyRoom, gameAnimFrame: number, gameKeysInterval: NodeJS.Timeout, game: Game | null }> {

    componentDidMount() {
        this.setState({ room: this.props.room });
        this.onRoomChange(this.props.room);
        this.forceUpdate();
        Socket.onRoomJoined((room) => this.onRoomChange(room), () => this.onRoomDestroy() );
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

    render() {
        return (
            <div>
                <div class="score">
                    <div class="score-value">
                        <div class="team-cube team-cube--left"></div>
                        <div id="score-left">0</div>
                    </div>
                    <div>-</div>
                    <div class="score-value">
                        
                        <div id="score-right">0</div>
                        <div class="team-cube team-cube--right"></div>
                    </div>
                </div>
            </div>
        );
    }
}