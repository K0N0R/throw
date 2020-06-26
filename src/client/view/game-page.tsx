import { h } from 'preact';

import { Game } from '../models/game';

import { KeysHandler } from './../../shared/keysHandler'
import { ILobbyRoom, IGameState } from '../../shared/events';
import { User } from './../models/socket';
import { Team } from '../../shared/team';
import { game_config } from './../../shared/callibration';
import { useState, useEffect } from 'preact/hooks';

// interface IGamePageProps {
//     room: ILobbyRoom;
// }

// interface IGamePageState {
//     room: ILobbyRoom;

//     gameAnimFrame: number;
//     gameKeysInterval: NodeJS.Timeout;
//     game: Game | null;
//     gameWon: Team | null;
//     gameWonGeneratedMessage: string;

//     scoreLeft: number;
//     scoreRight: number;
//     scoreGolden: boolean;
//     scorer: Team | null;
//     time: number;
// }

export default function GamePage(room: ILobbyRoom) {
    const [, setRoom] = useState<ILobbyRoom | null>(null);
    const [scoreGolden, setScoreGolden] = useState(false);
    const [scoreLeft, setScoreLeft] = useState(0);
    const [scoreRight, setScoreRight] = useState(0);
    //const [game, setGame] = useState<Game | null>(null);
    let game: Game | null = new Game();
    let gameAnimFrame: number;
    let gameKeysInterval: any;
    // const [gameAnimFrame, setGameAnimFrame] = useState(0);
    // const [gameKeysInterval, setGameKeysInterval] = useState<any>(null);
    const [time, setTime] = useState(0);
    const [gameWon, setGameWon] = useState('');
    const [gameWonMessage, setGameWonMessage] = useState('')
    const [scorer, setScorer] = useState('');

    useEffect(() => {
        onRoomChanged(room);
        User.socket.on('game::state', onGameStateChanged);
        User.socket.on('room::changed', onRoomChanged);
        User.socket.on('room::user-left', onUserLeftRoom);
        User.socket.on('room::destroyed', onRoomDestroyed);
        return () => {
            User.socket.off('room::changed', onRoomChanged);
            User.socket.off('room::user-left', onUserLeftRoom);
            User.socket.off('room::destroyed', onRoomDestroyed);
        }
    }, []);

    const onGameStateChanged = (gameState: IGameState) => {
        setScoreGolden(gameState.scoreGolden);
        setScoreLeft(gameState.scoreLeft);
        setScoreRight(gameState.scoreRight);
        setTime(gameState.time);
        if (gameState.teamWhoWon) {
            showWon(gameState.teamWhoWon);
        } else if (gameState.teamWhoScored) {
            showScorer(gameState.teamWhoScored);
        }
        // this.forceUpdate();
    }

    const onRoomChanged = (newValue: ILobbyRoom) => {
        if (newValue.playing && !game) {
            startGame();
        } else if (!newValue.playing && game) {
            breakGame();
        }
        setRoom(newValue);
    }

    const onUserLeftRoom = () => {
        breakGame();
    }

    const onRoomDestroyed = () => {
        breakGame();
    }

    const startGame = () => {
        const loop = () => {
            gameAnimFrame = requestAnimationFrame(loop);
            if (game) {
                game.run();
            }
        }
        loop();
        gameKeysInterval = setInterval(() => {
            KeysHandler.run();
        }, 4);
    }

    const breakGame = () => {
        cancelAnimationFrame(gameAnimFrame);
        clearInterval(gameKeysInterval);
        if (game) {
            game.dispose();
            game = null;
        }
    }

    const showTime = () => {
        let minutes = Math.floor(time / 60).toString();
        if (minutes.length !== 2) minutes = `0${minutes}`;
        let seconds = (time % 60).toString();
        if (seconds.length !== 2) seconds = `0${seconds}`;
        return `${minutes}:${seconds}`;
    }
    
    const showWon = (team: Team) => {
        setGameWon(team);
        setGameWonMessage(words[Math.floor(Math.random() * 7)])
        setTimeout(() => {
            setGameWon('');
        }, game_config.endGameResetTimeout);
    }

    const words = [
        'THAT WAS PURE LUCK!',
        'MAYBE REMATCH?',
        'NOOB TEAM!',
        'GOOD GAME!',
        'TOO EASY!',
        'NOT EVEN A CHALLENGE!',
        'GO PLAY TETRIS!',
        'YOU SUCK AND YOU KNOW IT!'
    ];

    const showScorer = (team: Team) => {
        setScorer(team);
        setTimeout(() => {
            setScorer('');
        }, game_config.goalResetTimeout);
    }

    return (
        <div class="game-state">
            {gameWon === Team.Left &&
                <div class="game-state__scorer game-state__scorer--left">
                    RED TEAM WON THE GAME!
                    <div class="game-state__scorer--punchline">{gameWonMessage}</div>
                </div>
            }
            {gameWon === Team.Right &&
                <div class="game-state__scorer game-state__scorer--right">
                    BLUE TEAM WON THE GAME!
                    <div class="game-state__scorer--punchline">{gameWonMessage}</div>
                </div>
            }
            {scorer === Team.Left &&
                <div class="game-state__scorer game-state__scorer--left">
                    Red team scores!
                </div>
            }
            {scorer === Team.Right &&
                <div class="game-state__scorer game-state__scorer--right">
                    Blue team scores!
                </div>
            }
                <div class="game-state__score">
                    <div class="game-state__score__value">
                        <div class="team-cube team-cube--left"></div>
                        <div>{scoreLeft}</div>
                    </div>
                    <div>-</div>
                    <div class="game-state__score__value">
                        <div>{scoreRight}</div>
                        <div class="team-cube team-cube--right"></div>
                    </div>
                </div>
                <div class="game-state__time"
                    style={scoreGolden ? 'color:gold;': ''}>
                    {showTime()}
                </div>
            { scoreGolden &&
                <div class="game-state__golden">🔔 Golden goal!</div>
            }
        </div>
    );
}