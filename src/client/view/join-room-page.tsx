import { render, h, Component } from 'preact';
import ListPage from './lobby-page';
import RoomPage from './room-page';
import { User } from './../models/user';
import { ILobbyRoom } from './../../shared/events';

export default class JoinRoomPage extends Component<{ room: ILobbyRoom}> {
    state = {
        password: "",
    };
    componentDidMount() {

    }
    
    onConfirm(): void {
        User.joinRoom(this.props.room, this.state.password, (room: ILobbyRoom) => {
            render(<RoomPage room={room}/>, document.getElementById('app') as Element);
        });
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

    render({room}, {password}) {
        return [
            <div class="dialog">
                <div class="form-field">
                    {room.name}
                </div>
                <div class="form-field">
                    <label>Password</label>
                    <input
                        value={password}
                        onInput={this.onPasswordChange.bind(this)}/>
                </div>
                <button 
                    class="form-btn form-btn-submit"
                    onClick={this.onCancel.bind(this)}>
                    Cancel :(
                </button>
                <button 
                    class="form-btn form-btn-submit"
                    onClick={this.onConfirm.bind(this)}>
                    Join room!
                </button>

            </div>
        ];
    }
}