import { render, h, Component } from 'preact';
import GamePage from './game-page';

export default class LobbyPage extends Component {
    
    nick: string = window.localStorage.getItem('throw_nick') || '';
    avatar: string = window.localStorage.getItem('throw_avatar') || '';
    componentDidMount() {

    }

    runGame() {
        render(<GamePage />, document.getElementById('app') as Element);
    }

    render() {
        return [
            <div class="centered">
                <div class="list">
                    Games List
                    <div class="list-item"
                        onClick={() => this.runGame()}>
                        <div class="list-item__column">Server Name</div>
                        <div class="list-item__column list-item__column--small">1/20</div>
                    </div>
                    <div>
                        Click on item in the list to join you dumb ass!
                    </div>
                </div>
            </div>
        ];
    }
}