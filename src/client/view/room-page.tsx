import { render, h, Component } from 'preact';
import { ILobbyRoom } from './../../shared/events';
import { User } from './../models/user';


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
    };
    
    onScoreLimitChange(e: any): void {
        if (this.state.room.data) {
            this.state.room.data.scoreLimit = e.target.value;
        }
        this.setState({ room: this.state.room});
    };

    rand(): void {}

    reset(): void {}

    render(_, { room }) {
        if (!room) return;
        const isUserAdmin = room.data.adminId === User.socket.id;
        return [
            <div class="lobby">
                <div class="lobby__head">
                    <div class="lobby__head__title">{room.name}</div>
                </div>
                <div class="lobby__body">
                    <div class="lobby__body__actions">
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
                    <div class="lobby__body__team">
                        <div class="lobby__body__team__label">Red</div>
                        <div class="lobby__body__team__members">
                            {   ...(room.data.left.map(item => 
                                <div class="lobby__body__team__member">
                                    <div>{item.avatar}</div>
                                    <div>{item.nick}</div>
                                </div>
                                ))
                            }
                        </div>
                    </div>
                    <div class="lobby__body__team">
                        <div class="lobby__body__team__label">Spectators</div>
                        <div class="lobby__body__team__members">
                            {   ...(room.data.spectators.map(item => 
                                <div class="lobby__body__team__member">
                                    <div>{item.avatar}</div>
                                    <div>{item.nick}</div>
                                </div>
                                ))
                            }
                        </div>
                    </div>
                    <div class="lobby__body__team">
                        <div class="lobby__body__team__label">Blue</div>
                        {   ...(room.data.right.map(item => 
                            <div class="lobby__body__team__member">
                                <div>{item.avatar}</div>
                                <div>{item.nick}</div>
                            </div>
                            ))
                        }
                    </div>
                </div>
                <div class="lobby__foot">
                    <div class="lobby__foot__option">
                        <label>Time limit</label>
                        <input
                            value={room.data.timeLimit}
                            readOnly={!isUserAdmin}
                            onInput={(e) => this.onTimeLimitChange(e)}/>
                    </div>
                    <div class="lobby__foot__option">
                        <label>Score limit</label>
                        <input
                            value={room.data.scoreLimit}
                            readOnly={!isUserAdmin}
                            onInput={(e) => this.onScoreLimitChange(e)}/>
                    </div>
                    <div class="lobby__foot__option">
                        <label>Map</label>
                        <input
                            value={'Rounded'}
                            readOnly={true}/>
                    </div>
                    <div>
                        <button>
                            Start Game!
                        </button>
                    </div>
                </div>

                <div class="lobby-chat">

                </div>
            </div>
        ];
    }
}