import { h } from 'preact';
import LobbyPage from './lobby-page';
import RoomPage from './room-page';
import { User } from '../models/socket';
import { ILobbyRoom } from 'shared/events';
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
        if (name) {
            User.socket.emit('room::create', { name, password, maxPlayersAmount });
            User.socket.on('room::created', (room: ILobbyRoom) => {
                goTo(<RoomPage room={room}/>);
                User.socket.off('room::created');
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