import { h } from 'preact';

import { Game } from '../models/game';

import { KeysHandler } from './../../shared/keysHandler'
import { IRoom, IRoomGameScore } from '../../shared/events';
import { User } from './../models/socket';
import { Team } from '../../shared/team';
import { game_config } from './../../shared/callibration';
import { useState, useEffect } from 'preact/hooks';
import { IRoomUser, IRoomGameParams, IRoomGameState } from './../../shared/events';
import { fpsMeter } from './utils';

interface IRoomComponentState {
    gameRunning: boolean;
    gameState: IRoomGameState;
    gameParams: IRoomGameParams;
}

export default function GamePage(props: IRoomComponentState) {
    let game: Game | null = null;
    let gameAnimFrame: number;
    let gameKeysInterval: any;
    const [fps, setFps] = useState(0);
    const [state, setState] = useState(props);
    const [scoreGolden, setScoreGolden] = useState(state.gameState.golden);
    const [scoreLeft, setScoreLeft] = useState(state.gameState.left);
    const [scoreRight, setScoreRight] = useState(state.gameState.right);
    const [time, setTime] = useState(state.gameState.time);
    const [gameWon, setGameWon] = useState('');
    const [scorerTeam, setScorerTeam] = useState('');
    const [scorerUser, setScorerUser] = useState<IRoomUser | undefined>(void 0);

    useEffect(() => {
       setState(props);
   }, [props])

    useEffect(() => {
        const gameTimeout = setTimeout(() => {
            if (state.gameRunning) startGame();
        });
        User.socket.on('room::game::started', onGameStarted);
        User.socket.on('room::game::stopped', onGameStopped);
        User.socket.on('room::game::state', onGameStateChanged);
        User.socket.on('room::game::winner', onGameWinner);
        User.socket.on('room::game::scorer', onGameScorer);
        User.socket.on('room::user::left', onUserLeftRoom);
        User.socket.on('room::destroyed', onRoomDestroyed);
        return () => {
            clearTimeout(gameTimeout);
            User.socket.off('room::game::started', onGameStarted);
            User.socket.off('room::game::stopped', onGameStopped);
            User.socket.off('room::game::state', onGameStateChanged);
            User.socket.off('room::game::winner', onGameWinner);
            User.socket.off('room::game::scorer', onGameScorer);
            User.socket.off('room::user::left', onUserLeftRoom);
            User.socket.off('room::destroyed', onRoomDestroyed);
        }
    }, []);

    const onGameStarted = () => {
        startGame();
    }

    const onGameStopped = () => {
        breakGame();
    }

    const onGameStateChanged = (gameState: IRoomGameState) => {
        setScoreGolden(gameState.golden);
        setScoreLeft(gameState.left);
        setScoreRight(gameState.right);
        setTime(gameState.time);
    }

    const onGameWinner = (data: Team) => {
        showWon(data);
    }

    const onGameScorer = (data: IRoomGameScore) => {
        showScorer(data.team, data.scorer);
    }

    const onUserLeftRoom = (user: IRoomUser) => {
        if (user.socketId === User.socket.id) {
            breakGame();
        }
    }

    const onRoomDestroyed = () => {
        breakGame();
    }

    const startGame = () => {
        if (!state.gameParams.mapKind) return;
        if (game) return;
        (document.querySelector('#room') as HTMLElement)?.focus();
        game = new Game(state.gameParams.mapKind);
        const loop = () => {
            setFps(fpsMeter());
            gameAnimFrame = requestAnimationFrame(loop);
            game?.run();
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
        setTimeout(() => {
            setGameWon('');
        }, game_config.endGameResetTimeout);
    }

    const showScorer = (team: Team, scorer?: IRoomUser) => {
        setScorerTeam(team);
        setScorerUser(scorer);
        setTimeout(() => {
            setScorerTeam('');
            setScorerUser(void 0);
        }, game_config.goalResetTimeout);
    }

    return (
        <div class="game-state">
            {gameWon === Team.Left &&
                <div class="game-state__winning-team game-state__scorer--left">
                    RED TEAM WON THE GAME!
                </div>
            }
            {gameWon === Team.Right &&
                <div class="game-state__winning-team game-state__scorer--right">
                    BLUE TEAM WON THE GAME!
                </div>
            }
            {scorerTeam === Team.Left &&
                <div class="game-state__scorer game-state__scorer--left">
                    Red team scores!
                </div>
            }
            {scorerTeam === Team.Right &&
                <div class="game-state__scorer game-state__scorer--right">
                    Blue team scores!
                </div>
            }
            {scorerUser &&
                <div class="game-state__scorer-user">
                    <div className={`${scorerUser.team === Team.Left ? 'game-state__scorer--left' : 'game-state__scorer--right'}`}>
                        {scorerUser.avatar} {scorerUser.nick}
                        {(scorerTeam && scorerTeam === scorerUser.team) || (gameWon && gameWon === scorerUser.team) ? ' - scored goal! ' : ' - scored own goal :('}
                    </div>
                </div>
            }
            <div>FPS: {fps}</div>
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