import { h } from 'preact';
import LobbyPage from './lobby-page';
import RoomPage from './room-page';
import { User } from '../models/socket';
import { ILobbyRoom, ILobbyRoomListItem } from './../../shared/events';
import { useState } from 'preact/hooks';
import { goTo } from './utils';

export default function JoinRoomPage(room: ILobbyRoomListItem) {
    const [password, setPassword] = useState('');

    const onConfirm = () => {
        User.socket.emit('room::join', { id: room.id, password });
        User.socket.on('room::user-joined', (room: ILobbyRoom) => {
            goTo(<RoomPage room={room}/>);
            User.socket.off('room::user-joined');
        });
    }

    const onCancel = () => {
        goTo(<LobbyPage />);
    }

    return (
        <div class="dialog">
            <div class="form-field">
                {name}
            </div>
            <div class="form-field">
                <label>Password</label>
                <input
                    value={password}
                    onInput={(e) => setPassword((e.target as HTMLInputElement).value)} />
            </div>
            <button
                class="form-btn form-btn-submit"
                onClick={onCancel}>
                Cancel :(
            </button>
            <button
                class="form-btn form-btn-submit"
                onClick={onConfirm}>
                Join room!
            </button>
        </div>
    );
}