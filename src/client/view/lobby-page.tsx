import { render, h } from 'preact';
import CreateRoomPage from './create-room-page';
import JoinRoomPage from './join-room-page';
import { User } from '../models/user';
import { ILobbyRoom } from '../../shared/events';
import { useEffect, useState } from 'preact/hooks';
import { useForceUpdate } from './hooks';
import { goTo } from './utils';


export default function ListPage() {

    // const forceUpdate = useForceUpdate;
    const [rooms, setRooms] = useState(User.lobbyRooms);

    useEffect(() => {
        User.enterLobby();
        User.setLobbyRoomsChange(() => {
            setRooms(User.lobbyRooms);
        });

        return () => {
            User.setLobbyRoomsChange(null);
            User.leaveLobby();
        }
    });

    const joinRoom = (room: ILobbyRoom) => {
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