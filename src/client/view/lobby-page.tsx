import { h } from 'preact';
import CreateRoomPage from './create-room-page';
import JoinRoomPage from './join-room-page';
import { User } from '../models/socket';
import { useEffect, useState } from 'preact/hooks';
import { goTo } from './utils';
import { ILobbyRoomListItem } from './../../shared/events';


export default function LobbyPage() {
    const [rooms, setRooms] = useState([] as ILobbyRoomListItem[]);

    useEffect(() => {
        User.socket.emit('lobby::enter');
        User.socket.on('lobby::room-list', (rooms: ILobbyRoomListItem[]) => {
            setRooms(rooms);
        });

        return () => {
            User.socket.off('lobby::room-list')
        }
    });

    const joinRoom = (room: ILobbyRoomListItem) => {
        goTo(<JoinRoomPage {...room } />);
    }

    const createNewGame = () => {
        goTo(<CreateRoomPage />);
    }

    return (
        <div class="centered">
            <div class="list">
                <div class="list-header">
                    <div>Games List</div>
                    <button class="list-header__button"
                        onClick={() => createNewGame()}>
                        Create game
                    </button>
                </div>
                {...(rooms.map(room =>
                        <div class="list-item"
                            onClick={() => joinRoom(room)}>
                            <div class="list-item__column">{room.name}</div>
                            <div class="list-item__column">{room.playing ? 'Game is currently running!': ''}</div>
                            <div class="list-item__column list-item__column--small">{room.players}</div>
                        </div>
                    ))
                }
                <div class="list-footer">
                    Click on item in the list to join you dumb ass!
                </div>
            </div>
        </div>
    );
}