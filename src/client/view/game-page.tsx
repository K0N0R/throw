import { h, Component } from 'preact';

import { Game } from '../models/game';

import { KeysHandler } from './../../shared/keysHandler'
import { ILobbyRoom, IGameState } from '../../shared/events';
import { User } from './../models/socket';
import { Team } from '../../shared/team';
import { game_config } from './../../shared/callibration';
import { ILobbyUser } from './../../shared/events';

interface IGamePageProps {
    room: ILobbyRoom;
}

interface IGamePageState {
    room: ILobbyRoom;

    gameAnimFrame: number;
    gameKeysInterval: NodeJS.Timeout;
    game: Game | null;
    gameWon: Team | null;
    gameWonGeneratedMessage: string;

    scoreLeft: number;
    scoreRight: number;
    scoreGolden: boolean;
    scorer: Team | null;
    scorerUser: ILobbyUser | null;
    time: number;
}

export default class GamePage extends Component<IGamePageProps, IGamePageState> {

    componentDidMount() {
        this.setState({ scoreLeft: 0, scoreRight: 0, scoreGolden: false, time: 0 });
        this.bindSocket();
        this.onRoomChanged(this.props.room);
    }

    bindSocket(): void {
        const onGameStateChanged = (gameState: IGameState) => {
            this.onGameStateChanged(gameState);
        };
        User.socket.on('game::state', onGameStateChanged);

        const onRoomChanged = (room: ILobbyRoom) => {
            this.onRoomChanged(room);
        };
        User.socket.on('room::changed', onRoomChanged);

        const onUserLeftRoom = () => {
            this.onUserLeftRoom();
            onDispose();
        };
        User.socket.on('room::user-left', onUserLeftRoom);

        const onRoomDestroyed = () => {
            this.onRoomDestroyed();
            onDispose();
        };
        User.socket.on('room::destroyed', onRoomDestroyed);


        const onDispose = () => {
            User.socket.off('room::changed', onRoomChanged);
            User.socket.off('room::user-left', onUserLeftRoom);
            User.socket.off('room::destroyed', onRoomDestroyed);
            User.socket.off('game::state', onRoomDestroyed);
        };
    }

    onGameStateChanged(gameState: IGameState): void {
        this.setState({ scoreGolden: gameState.scoreGolden });
        this.setState({ scoreLeft: gameState.scoreLeft });
        this.setState({ scoreRight: gameState.scoreRight });
        this.setState({ time: gameState.time });
        if (gameState.teamWhoWon) {
            this.showWon(gameState.teamWhoWon);
        } else if (gameState.teamWhoScored) {
            this.showScorer(gameState.teamWhoScored, gameState.userWhoScored);
        }

        this.forceUpdate();
    }

    onRoomChanged(newValue: ILobbyRoom): void {
        if (newValue.playing && !this.state.game) {
            this.setState({ room: newValue }, () => {
                this.startGame();
            });
        } else if (!newValue.playing && this.state.game) {
            this.setState({ room: newValue }, () => {
                this.breakGame();
            });
        }
        if (newValue.playing) {
            this.state.game?.updateAfkers(newValue.users);
        }
        this.setState({ room: newValue });
        this.forceUpdate();
    }

    onUserLeftRoom(): void {
        this.breakGame();
    }

    onRoomDestroyed(): void {
        this.breakGame();
    }
    //#endregion

    //#region game
    startGame(): void {
        this.setState({ game: new Game(this.state.room.mapKind)});
        const loop = () => {
            this.setState({ gameAnimFrame: requestAnimationFrame(loop) });
            if (this.state.game) this.state.game.run();
        }
        loop();
        this.setState({ gameKeysInterval: setInterval(() => {
            KeysHandler.run();
        }, 4)});
        (document.querySelector('#room') as HTMLElement)?.focus();
    }

    breakGame(): void {
        cancelAnimationFrame(this.state.gameAnimFrame);
        clearInterval(this.state.gameKeysInterval);
        if (this.state.game) {
            this.state.game.dispose();
            this.setState({ game: null });
        }
    }
    //#endregion

    //#region filters
    showTime(): string {
        let minutes = Math.floor(this.state.time / 60).toString();
        if (minutes.length !== 2) minutes = `0${minutes}`;
        let seconds = (this.state.time % 60).toString();
        if (seconds.length !== 2) seconds = `0${seconds}`;
        return `${minutes}:${seconds}`;
    }
    //#endregion

    //#region animations
    showWon(team: Team) {
        this.setState({gameWon: team});
        this.setGameWonMessage();
        this.forceUpdate();
        setTimeout(() => {
            this.setState({gameWon: null});
        }, game_config.endGameResetTimeout);
    }

    setGameWonMessage(): void {
        this.setState({ gameWonGeneratedMessage: [
            'THAT WAS PURE LUCK!',
            'MAYBE REMATCH?',
            'NOOB TEAM!',
            'GOOD GAME!',
            'TOO EASY!',
            'NOT EVEN A CHALLENGE!',
            'GO PLAY TETRIS!',
            'YOU SUCK AND YOU KNOW IT!'
            ][Math.round(Math.random() * 7)]});
    }

    showScorer(team: Team, user?: ILobbyUser) {
        this.setState({scorer: team});
        this.setState({ scorer: team, scorerUser: user }, () => {
            this.forceUpdate();
            setTimeout(() => {
                this.setState({scorer: null});
                this.setState({ scorerUser: null })
            }, game_config.goalResetTimeout);
        })
    }
    //#endregion

    render(_, state: IGamePageState) {
        if (!state.room) return;
        return (
            <div class="game-state">
                {state.gameWon === Team.Left &&
                <div class="game-state__scorer game-state__scorer--left">
                    RED TEAM WON THE GAME!
                    <div class="game-state__scorer--punchline">{state.gameWonGeneratedMessage}</div>
                </div>
                }
                {state.gameWon === Team.Right &&
                <div class="game-state__scorer game-state__scorer--right">
                    BLUE TEAM WON THE GAME!
                    <div class="game-state__scorer--punchline">{state.gameWonGeneratedMessage}</div>
                </div>
                }
                {state.scorer === Team.Left &&
                <div class="game-state__scorer game-state__scorer--left">
                    Red team scores!
                    {state.scorerUser &&
                    <div className={`game-state__scorer__player ${state.scorerUser.team === Team.Left ? 'game-state__scorer--left' : 'game-state__scorer--right'}`}>
                        {state.scorerUser.avatar} {state.scorerUser.nick}
                        {state.scorer === state.scorerUser.team ? ' - scored goal! ' : ' - scored own goal :('}
                    </div>
                    }
                </div> 
                }
                {state.scorer === Team.Right &&
                <div class="game-state__scorer game-state__scorer--right">
                    Blue team scores!
                    {state.scorerUser &&
                    <div className={`game-state__scorer__player ${state.scorerUser.team === Team.Left ? 'game-state__scorer--left' : 'game-state__scorer--right'}`}>
                        {state.scorerUser.avatar} {state.scorerUser.nick}
                        {state.scorer === state.scorerUser.team ? ' - scored goal! ' : ' - scored own goal :('}
                    </div>
                    }
                </div>
                }
                <div class="game-state__score">
                    <div class="game-state__score__value">
                        <div class="team-cube team-cube--left"></div>
                        <div>{state.scoreLeft}</div>
                    </div>
                    <div>-</div>
                    <div class="game-state__score__value">
                        <div>{state.scoreRight}</div>
                        <div class="team-cube team-cube--right"></div>
                    </div>
                </div>
                <div class="game-state__time"
                    style={state.scoreGolden ? 'color:gold;': ''}>
                    {this.showTime()}
                </div>
                { state.scoreGolden &&
                <div class="game-state__golden">🔔 Golden goal!</div>
                }
            </div>

        );
    }
}