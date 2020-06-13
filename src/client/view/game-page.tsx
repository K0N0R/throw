import { h, Component } from 'preact';

import { Game } from '../models/game';

import { KeysHandler } from './../../shared/keysHandler'
import { game_config } from './../../shared/callibration';


export default class GamePage extends Component {

    componentDidMount() {
        const game = new Game();
        const loop = () => {
            requestAnimationFrame(loop);
            game.run();
        }
        loop();
        setInterval(() => {
            KeysHandler.run();
        }, 4);
    }
    

    render() {
        return [
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
        ];
    }
}