import { h, Component } from 'preact';
import io from 'socket.io-client';
import { Game } from '../models/game';
import { host, port } from '../../shared/serverConfig';

const socket = io({
    host: `${host}:${port}`
});


export default class StartPage extends Component {

    componentDidMount() {
        const game = new Game(socket);
        const loop = () => {
            requestAnimationFrame(loop);
            game.run();
        }
        loop();
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
                    
                    <div id="score-right"></div>
                    <div class="team-cube team-cube--right"></div>
                </div>
            </div>
        ];
    }
}