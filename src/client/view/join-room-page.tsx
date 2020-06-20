import { h } from 'preact';
import ListPage from './lobby-page';
import RoomPage from './room-page';
import { Socket } from '../models/socket';
import { ILobbyRoom } from './../../shared/events';
import { useState } from 'preact/hooks';
import { goTo } from './utils';

export default function JoinRoomPage(room: ILobbyRoom) {
    const [password, setPassword] = useState('');

    const onConfirm = () => {
        Socket.joinRoom(room, password, (room: ILobbyRoom) => {
            goTo(<RoomPage room={room}/>);
        });
    }

    const onCancel = () => {
        goTo(<ListPage />);
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