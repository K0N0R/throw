import { render, h, Component } from 'preact';
import CreateRoomPage from './create-room-page';
import JoinRoomPage from './join-room-page';
import { User } from './../models/user';
import { ILobbyRoom } from './../../shared/events';


export default class ListPage extends Component {
    componentDidMount() {
        User.enterLobby();
        User.setAvailableRoomsCallback(() => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        User.leaveLobby();
    }

    joinRoom(room: ILobbyRoom) {
        render(<JoinRoomPage {...{ room: room }} />, document.getElementById('app') as Element);

    }

    createNewGame() {
        render(<CreateRoomPage />, document.getElementById('app') as Element);
    }

    render(_,) {
        return [
            <div class="centered">
                <div class="list">
                    <div class="list-header">
                        <div>Games List</div>
                        <button class="list-header__button"
                            onClick={() => this.createNewGame()}>
                            Create game
                        </button>
                    </div>
                    {...(User.availableRooms.map(room =>
                        <div class="list-item"
                            onClick={() => this.joinRoom(room)}>
                            <div class="list-item__column">{room.name}</div>
                            <div class="list-item__column list-item__column--small">{room.players}</div>
                        </div>))
                    }
                    <div class="list-footer">
                        Click on item in the list to join you dumb ass!
                    </div>
                </div>
            </div>
        ];
    }
}