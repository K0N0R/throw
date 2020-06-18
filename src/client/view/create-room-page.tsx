import { render, h, Component } from 'preact';
import ListPage from './lobby-page';
import RoomPage from './room-page';
import { User } from './../models/user';
import { ILobbyRoom } from 'shared/events';

export default class CreateRoomPage extends Component {
    state = {
        name: window.localStorage.getItem('throw_nick') + "'s room",
        password: '',
        maxPlayersAmount: 20
    };

    componentDidMount() {

    }
    
    onConfirm(): void {
        if (this.state.name) {
            User.createRoom(this.state, (room: ILobbyRoom) => {
                render(<RoomPage room={room}/>, document.getElementById('app') as Element);
            });
        }
    }
    onCancel(): void {
        render(<ListPage />, document.getElementById('app') as Element);
    }

    onNameChange(e: any): void {
        this.setState({ name: e.target.value });
    };

    onPasswordChange(e: any): void {
        this.setState({ password: e.target.value });
    };

    render(_, { name, password, maxPlayersAmount}) {
        return [
            <div class="dialog">
                <div class="form-field">
                    <label>Vault name</label>
                    <input
                        value={name}
                        onInput={this.onNameChange.bind(this)}/>
                </div>
                <div class="form-field">
                    <label>Password</label>
                    <input
                        value={password}
                        onInput={this.onPasswordChange.bind(this)}/>
                </div>
                <div class="form-field">
                    <label>Max players</label>
                    <input
                        value={maxPlayersAmount}
                        readOnly={true}
                        onInput={this.onNameChange.bind(this)}/>
                </div>

                <button 
                    class="form-btn form-btn-submit"
                    onClick={this.onCancel.bind(this)}>
                    Cancel :(
                </button>
                <button 
                    class="form-btn form-btn-submit"
                    onClick={this.onConfirm.bind(this)}>
                    Create room!
                </button>

            </div>
        ];
    }
}