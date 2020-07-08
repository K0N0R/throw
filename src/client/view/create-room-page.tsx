import { h } from 'preact';
import LobbyPage from './lobby-page';
import RoomPage from './room-page';
import { User } from '../models/socket';
import { IRoomState } from 'shared/events';
import { goTo } from './utils';
import { useLocalStorage } from './hooks';
import { useState, useEffect } from 'preact/hooks';

export default function CreateRoomPage() {
    const [name] = useLocalStorage('throw_nick', '');
    const [roomName, setRoomName] = useLocalStorage('throw_room', `${name}'s room`);
    const [password, setPassword] = useState('');
    const maxPlayersAmount = 20;

    useEffect(() => {
        setRoomName(`${name}'s room`);
    }, [])

    const onConfirm = () => {
        if (roomName) {
            User.socket.emit('room::create', { name: roomName, password, maxPlayersAmount });
            User.socket.on('room::user::joined', (roomState: IRoomState) => {
                goTo(<RoomPage {...roomState}/>);
                User.socket.off('room::user::joined');
            });
        }
    }

    const onCancel = () => {
        goTo(<LobbyPage />);
    }

    return (
        <div class="dialog">
            <div class="form-field">
                <label>Vault name</label>
                <input
                    value={roomName}
                    onInput={(e) => setRoomName((e.target as HTMLInputElement).value)}/>
            </div>
            <div class="form-field">
                <label>Password</label>
                <input
                    value={password}
                    onInput={(e) => setPassword((e.target as HTMLInputElement).value)}/>
            </div>
            <div class="form-field">
                <label>Max players</label>
                <input
                    value={maxPlayersAmount}
                    readOnly={true}/>
            </div>
            <button
                class="form-btn form-btn-submit"
                onClick={onCancel}>
                Cancel 😢
            </button>
            <button
                class="form-btn form-btn-submit form-btn-submit--primary"
                onClick={onConfirm}>
                Create room!
            </button>
        </div>
    );
}