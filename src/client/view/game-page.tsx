import { h } from 'preact';

import { Game } from '../models/game';

import { KeysHandler } from './../../shared/keysHandler'
import { useEffect } from 'preact/hooks';
import { ILobbyRoom } from './../../shared/events';


export default function GamePage(room: ILobbyRoom) {

    useEffect(() => {
        const game = new Game(room);
        const loop = () => {
            requestAnimationFrame(loop);
            game.run();
        }
        loop();
        setInterval(() => {
            KeysHandler.run();
        }, 4);
    }, []);

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
            <div class="configuration">
                <div>X - shoot</div>
                <div>SHIFT - dash</div>
                <div> ARROW KEYS - movement</div>
            </div>
        </div>
    );
}