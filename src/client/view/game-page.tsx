import { h } from 'preact';

import { Game } from '../models/game';

import { KeysHandler } from './../../shared/keysHandler'
import { ILobbyRoom, IGameState } from '../../shared/events';
import { User } from './../models/socket';
import { Team } from '../../shared/team';
import { game_config } from './../../shared/callibration';
import { useState, useEffect } from 'preact/hooks';
import { ILobbyUser } from './../../shared/events';

export default function GamePage(room: ILobbyRoom) {
    let game: Game | null = null;
    let gameAnimFrame: number;
    let gameKeysInterval: any;
    const [, setRoom] = useState<ILobbyRoom | null>(null);
    const [scoreGolden, setScoreGolden] = useState(false);
    const [scoreLeft, setScoreLeft] = useState(0);
    const [scoreRight, setScoreRight] = useState(0);
    const [time, setTime] = useState(0);
    const [gameWon, setGameWon] = useState('');
    const [scorer, setScorer] = useState('');
    const [scorerUser, setScorerUser] = useState<ILobbyUser | undefined>(void 0);

    useEffect(() => {
        onRoomChanged(room);
        User.socket.on('game::state', onGameStateChanged);
        User.socket.on('room::changed', onRoomChanged);
        User.socket.on('room::user-left', onUserLeftRoom);
        User.socket.on('room::destroyed', onRoomDestroyed);
        return () => {
            User.socket.off('game::state', onGameStateChanged);
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
            showWon(gameState.teamWhoWon, gameState.userWhoScored);
        } else if (gameState.teamWhoScored) {
            showScorer(gameState.teamWhoScored, gameState.userWhoScored);
        }
    }

    const onRoomChanged = (newValue: ILobbyRoom) => {
        if (newValue.playing && !game) {
            startGame(newValue);
        } else if (!newValue.playing && game) {
            breakGame();
        }
        setRoom(newValue);
        if (newValue.playing) {
            game?.updateAfkers(newValue.users);
        }
    }

    const onUserLeftRoom = () => {
        breakGame();
    }

    const onRoomDestroyed = () => {
        breakGame();
    }

    const startGame = (newValue: ILobbyRoom) => {
        (document.querySelector('#room') as HTMLElement)?.focus();
        game = new Game(newValue.mapKind);
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
    
    const showWon = (team: Team, userWhoScored?: ILobbyUser) => {
        setGameWon(team);
        setScorerUser(userWhoScored);
        setTimeout(() => {
            setGameWon('');
            setScorerUser(void 0);
        }, game_config.endGameResetTimeout);
    }

    const showScorer = (team: Team, userWhoScored?: ILobbyUser) => {
        setScorer(team);
        setScorerUser(userWhoScored);
        setTimeout(() => {
            setScorer('');
            setScorerUser(void 0);
        }, game_config.goalResetTimeout);
    }

    return (
        <div class="game-state">
            {gameWon === Team.Left &&
                <div class="game-state__scorer game-state__scorer--left">
                    RED TEAM WON THE GAME!
                </div>
            }
            {gameWon === Team.Right &&
                <div class="game-state__scorer game-state__scorer--right">
                    BLUE TEAM WON THE GAME!
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
            {scorerUser &&
                <div class="game-state__scorer-user">
                    <div className={`${scorerUser.team === Team.Left ? 'game-state__scorer--left' : 'game-state__scorer--right'}`}>
                        {scorerUser.avatar} {scorerUser.nick}
                        {(scorer && scorer === scorerUser.team) || (gameWon && gameWon === scorerUser.team) ? ' - scored goal! ' : ' - scored own goal :('}
                    </div>
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