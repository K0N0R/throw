import { h } from 'preact';
import CreateRoomPage from './create-room-page';
import JoinRoomPage from './join-room-page';
import { User } from '../models/socket';
import { useEffect, useState } from 'preact/hooks';
import { goTo } from './utils';
import { IRoom } from './../../shared/events';


export default function LobbyPage() {
    const [rooms, setRooms] = useState([] as IRoom[]);

    useEffect(() => {
        User.socket.emit('lobby::enter');
        User.socket.on('lobby::room-list', (rooms: IRoom[]) => {
            setRooms(rooms);
        });
        return () => {
            User.socket.off('lobby::room-list')
        }
    }, []);

    const joinRoom = (room: IRoom) => {
        goTo(<JoinRoomPage {...room } />);
    }

    const createNewGame = () => {
        goTo(<CreateRoomPage />);
    }

    return (
        <div class="dialog">
            <div class="list">
                <div class="list-header">
                    <div>Games List</div>
                </div>
                {...(rooms.map(room =>
                        <div class="list-item"
                            onClick={() => joinRoom(room)}>
                            <div class="list-item__column">{room.name}</div>
                        </div>
                    ))
                }
                <div class="list-footer">
                    { rooms.length <= 0 ? 'No room found, click on the button to add one.' : 'Click on item in the list to join!'}
                </div>
                <button class="button button--primary"
                        onClick={() => createNewGame()}>
                        Create game
                </button>
            </div>
        </div>
    );
}