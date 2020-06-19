import { h, Component } from 'preact';
import { ILobbyRoom } from './../../shared/events';
import { User } from './../models/user';
import { Team } from '../../shared/team';


export default class RoomPage extends Component<{ room: ILobbyRoom}, { room: ILobbyRoom }> {
    componentDidMount() {
        this.setState({ room: this.props.room });
        this.forceUpdate();

        User.setRoomChange((room: ILobbyRoom) => {
            this.setState({ room });
            this.forceUpdate();
        })
    }

    onTimeLimitChange(e: any): void {
        if (this.state.room.data) {
            this.state.room.data.timeLimit = e.target.value;
        }
        this.setState({ room: this.state.room});
        User.updateRoom(this.state.room);
    };
    
    onScoreLimitChange(e: any): void {
        if (this.state.room.data) {
            this.state.room.data.scoreLimit = e.target.value;
        }
        this.setState({ room: this.state.room});
        User.updateRoom(this.state.room);
    };

    onUserMoveInit(eMouseDown: MouseEvent, user: User): void {
        const onMouseMove  = (eMouseMove) => {

        };
        const onMouseUp = (eMouseUp) => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

    }

    rand(): void {}

    reset(): void {}

    render(_, { room }) {
        if (!room) return;
        const isUserAdmin = room.data.adminId === User.socket.id;
        return (
            <div class="lobby">
                <div class="lobby__head">
                    <div class="lobby__head__title">{room.name}</div>
                </div>
                <div class="room__body">
                    <div class="room__body__actions">
                        <button
                            onClick={() => this.rand()}
                            disabled={!isUserAdmin}>
                            Rand
                        </button>
                        <button
                            onClick={() => this.reset()}
                            disabled={!isUserAdmin}>
                            Reset
                        </button>
                    </div>
                    <div class="room__body__team">
                        <div class="room__body__team__label room__body__team__label--red">Red</div>
                        <div class="room__body__team__members">
                            {   ...(room.data.users.filter(user => user.team === Team.Left).map(item => 
                                <div class="room__body__team__member">
                                    <div>{item.avatar}</div>
                                    <div>{item.nick}</div>
                                </div>
                                ))
                            }
                        </div>
                    </div>
                    <div class="room__body__team">
                        <div class="room__body__team__label">Spectators</div>
                        <div class="room__body__team__members">
                            {   ...(room.data.users.filter(user => user.team === Team.Spectator).map(item => 
                                <div class="room__body__team__member">
                                    <div>{item.avatar}</div>
                                    <div>{item.nick}</div>
                                </div>
                                ))
                            }
                        </div>
                    </div>
                    <div class="room__body__team">
                        <div class="room__body__team__label room__body__team__label--blue">Blue</div>
                        {   ...(room.data.users.filter(user => user.team === Team.Right).map(item => 
                            <div class="room__body__team__member"
                                onMouseDown={(e) => this.onUserMoveInit(e, item)}>
                                <div>{item.avatar}</div>
                                <div>{item.nick}</div>
                            </div>
                            ))
                        }
                    </div>
                </div>
                <div class="room__foot">
                    <div class="room__foot__option">
                        <label class="room__foot__option__label">Time limit</label>
                        <input class="room__foot__option__input"
                            value={room.data.timeLimit}
                            readOnly={!isUserAdmin}
                            onInput={(e) => this.onTimeLimitChange(e)}/>
                    </div>
                    <div class="room__foot__option">
                        <label class="room__foot__option__label">Score limit</label>
                        <input class="room__foot__option__input"
                            value={room.data.scoreLimit}
                            readOnly={!isUserAdmin}
                            onInput={(e) => this.onScoreLimitChange(e)}/>
                    </div>
                    <div class="room__foot__option">
                        <label class="room__foot__option__label">Map</label>
                        <input class="room__foot__option__input"
                            value={'Rounded'}
                            readOnly={true}/>
                    </div>
                    <div class="room__foot__option">
                        <button class="room__foot__option__button">
                            Start Game!
                        </button>
                    </div>
                </div>

                <div class="room-chat">

                </div>
            </div>
        );
    }
}