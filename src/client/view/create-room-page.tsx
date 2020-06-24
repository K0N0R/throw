import { h } from 'preact';
import ListPage from './lobby-page';
import RoomPage from './room-page';
import { Socket } from '../models/socket';
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
            Socket.createRoom({ name, password, maxPlayersAmount }, (room: ILobbyRoom) => {
                goTo(<RoomPage room={room}/>);
            });
        }
    }

    const onCancel = () => {
        goTo(<ListPage />);
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