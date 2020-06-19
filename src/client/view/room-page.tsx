import { h, Component, render } from 'preact';
import { ILobbyRoom } from './../../shared/events';
import { User } from './../models/user';
import { Team } from '../../shared/team';
import GamePage from './game-page';

export default class RoomPage extends Component<{ room: ILobbyRoom}, { room: ILobbyRoom }> {
    componentDidMount() {
        this.setState({ room: this.props.room });
        this.forceUpdate();

        User.setRoomChange((room: ILobbyRoom) => {
            if (!this.state.room.playing && room.playing) {
                this.gameRunning();
            } else if(this.state.room.playing && !room.playing) {
                this.gameStopped();
            }
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

    drag(ev, user): void {
        if (this.state.room.data?.adminId !== User.socket.id) return;
        ev.dataTransfer.setData('userId', user.socketId);
    }

    dragOver(ev): void {
        if (this.state.room.data?.adminId !== User.socket.id) return;
        ev.preventDefault();
    }

    drop(ev, team): void {
        if (this.state.room.data?.adminId !== User.socket.id) return;
        ev.preventDefault();
        const userId = ev.dataTransfer.getData('userId')
        const user = this.state.room.data?.users.find(user => user.socketId === userId);
        if (!user) return;
        user.team = team;
        User.updateRoom(this.state.room);
    }

    startGame(): void {
        if (this.state.room.data?.adminId !== User.socket.id) return;
        this.state.room.playing = true;
        this.gameRunning();
        User.updateRoom(this.state.room);
    }

    endGame(): void {
        if (this.state.room.data?.adminId !== User.socket.id) return;
        this.state.room.playing = false;
        this.gameStopped();
        User.updateRoom(this.state.room);
    }

    gameRunning(): void {
        const element = document.getElementById('game');
        if(!element) return;
        render(<GamePage room={this.state.room}/>, element);
    }

    gameStopped(): void {
        // remove GamePage
    }




    rand(): void {}

    reset(): void {}

    render(_, { room }) {
        if (!room) return;
        const isUserAdmin = room.data.adminId === User.socket.id;
        return (
            <div class="room">
                <div class="room__game" id={'game'}></div>
                <div class="room__head">
                    <div class="room__head__title">{room.name}</div>
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
                    <div class="room__body__team"
                        onDrop={(ev) => this.drop(ev, Team.Left)}
                        onDragOver={(ev) => this.dragOver(ev)}>
                        <div class="room__body__team__label room__body__team__label--red">Red</div>
                        <div class="room__body__team__members"
                            >
                            {   ...(room.data.users.filter(user => user.team === Team.Left).map(item => 
                                <div class="room__body__team__member"
                                    onDragStart={(e) => this.drag(e, item)} draggable={true}>
                                    <div>{item.avatar}</div>
                                    <div>{item.nick}</div>
                                </div>
                                ))
                            }
                        </div>
                    </div>
                    <div class="room__body__team"
                        onDragOver={(ev) => this.dragOver(ev)}
                        onDrop={(ev) => this.drop(ev, Team.Spectator)}>
                        <div class="room__body__team__label">Spectators</div>
                        <div class="room__body__team__members">
                            {   ...(room.data.users.filter(user => user.team === Team.Spectator).map(item => 
                                <div class="room__body__team__member"
                                    onDragStart={(e) => this.drag(e, item)} draggable={true}>
                                    <div>{item.avatar}</div>
                                    <div>{item.nick}</div>
                                </div>
                                ))
                            }
                        </div>
                    </div>
                    <div class="room__body__team"
                        onDragOver={(ev) => this.dragOver(ev)}
                        onDrop={(ev) => this.drop(ev, Team.Right)}>
                        <div class="room__body__team__label room__body__team__label--blue">Blue</div>
                            <div class="room__body__team__members">
                            {   ...(room.data.users.filter(user => user.team === Team.Right).map(item => 
                                <div class="room__body__team__member"
                                    onDragStart={(e) => this.drag(e, item)} draggable={true}>
                                    <div>{item.avatar}</div>
                                    <div>{item.nick}</div>
                                </div>
                                ))
                            }
                        </div>
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
                        <button class="room__foot__option__button"
                            onClick={(e) => this.startGame()}>
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