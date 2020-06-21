import { h, Component, render } from 'preact';
import { ILobbyRoom, IRoomDataMessage, IRoomData } from './../../shared/events';
import { Socket } from '../models/socket';
import { Team } from '../../shared/team';
import GamePage from './game-page';
import { goTo } from './utils';
import ListPage from './lobby-page';
import { Keys } from '../../shared/keys';

interface IRoomState {
    room: ILobbyRoom;
    messages: IRoomDataMessage[];
    newMessage: string;
    lobbyViewToggled: boolean;
}

export default class RoomPage extends Component<{ room: ILobbyRoom}, IRoomState> {

    componentDidMount() {
        this.setState({ room: this.props.room, messages: [
            {
                value: 'ARROW KEYS - movement',
                nick: 'GAME',
                avatar: '🛠️'
            }, {
                value: 'X - shoot',
                nick: 'GAME',
                avatar: '🛠️'
            }, {
                value: 'SHIFT - dash',
                nick: 'GAME',
                avatar: '🛠️'
            },
        ]});
        this.onRoomChange(this.props.room);
        this.forceUpdate();
        Socket.onRoomJoined((room) => this.onRoomChange(room), () => goTo(<ListPage/>));
        this.unBindEvents = this.bindEvents();
    }

    componentWillUnmount() {
        if (this.unBindEvents) {
            this.unBindEvents();
        }
    }

    unBindEvents!: () => void;
    bindEvents(): () => void {
        const onKeyUp = (e) => this.onLobbyKey(e);
        document.addEventListener('keyup', onKeyUp);
        return () => {
            document.removeEventListener('keyup', onKeyUp);
        }
    }

    onRoomChange(newValue: ILobbyRoom): void {
        this.addNewMessage(newValue.data);
        this.setState({ room: newValue });
        this.forceUpdate();
    }

    onTimeLimitChange(e: any): void {
        if (this.state.room.data) {
            this.state.room.data.timeLimit = e.target.value;
        }
        this.setState({ room: this.state.room});
        Socket.updateRoom(this.state.room);
    };
    
    onScoreLimitChange(e: any): void {
        if (this.state.room.data) {
            this.state.room.data.scoreLimit = e.target.value;
        }
        this.setState({ room: this.state.room});
        Socket.updateRoom(this.state.room);
    };

    //#region user team change
    drag(ev, user): void {
        if (this.state.room.data?.adminId !== Socket.socket.id) return;
        ev.dataTransfer.setData('userId', user.socketId);
    }

    dragOver(ev): void {
        if (this.state.room.data?.adminId !== Socket.socket.id) return;
        ev.preventDefault();
    }

    drop(ev, team): void {
        if (this.state.room.data?.adminId !== Socket.socket.id) return;
        ev.preventDefault();
        const userId = ev.dataTransfer.getData('userId')
        const user = this.state.room.data?.users.find(user => user.socketId === userId);
        if (!user) return;
        user.team = team;
        Socket.updateRoom(this.state.room);
    }

    rand(): void {
        if (this.state.room.data?.adminId !== Socket.socket.id) return;
        if (this.state.room && this.state.room.data) {
            const users = this.state.room.data.users;
            users.forEach((user) => user.team = Team.Spectator);
            const teamMax = Math.ceil(users.length / 2);
            users.forEach((user, idx: number) => {
                const rand = Math.random();
                if (rand > 0.5) {
                    if (users.filter(user => user.team === Team.Left).length < teamMax) {
                        user.team = Team.Left;
                    } else {
                        user.team = Team.Right;
                    }
                } else {
                    if (users.filter(user => user.team === Team.Right).length < teamMax) {
                        user.team = Team.Right;
                    } else {
                        user.team = Team.Left;
                    }
                }
            });
            Socket.updateRoom(this.state.room);
        }
    }

    reset(): void {
        if (this.state.room.data?.adminId !== Socket.socket.id) return;
        this.state.room.data?.users.forEach((user) => {
            user.team = Team.Spectator;
        });
        Socket.updateRoom(this.state.room);
    }
    //#endregion

    //#region game
    onLobbyKey(e): void {
        if (e.keyCode === Keys.Esc) {
            if (this.state.room.playing) {
                this.setState({ lobbyViewToggled: !this.state.lobbyViewToggled});
            }
        }
    }
    startGame(): void {
        if (this.state.room.data?.adminId !== Socket.socket.id) return;
        this.state.room.playing = true;
        Socket.updateRoom(this.state.room);
    }

    endGame(): void {
        if (this.state.room.data?.adminId !== Socket.socket.id) return;
        this.state.room.playing = false;
        this.setState({ lobbyViewToggled: false});
        Socket.updateRoom(this.state.room);
    }

    //#endregion

    //#region chat
    addNewMessage(roomData: IRoomData | void): void {
        if (!roomData || !roomData?.lastMessage) return;
        this.state.messages.push(roomData.lastMessage);
        roomData.lastMessage = null;
        setTimeout(() => { //scroll to last meessage
            const messagesEl = document.querySelector('.room__chat__messages')
            if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
        })
    }

    onNewMessageChange(e: any): void {
        this.setState({ newMessage: e.target.value});
    };

    sendMessage(e: KeyboardEvent): void {
        if (e.keyCode !== Keys.Enter) return;
        if (this.state.room.data) {
            this.state.room.data.lastMessage = { nick: Socket.nick, avatar: Socket.avatar, value: this.state.newMessage};
            Socket.updateRoom(this.state.room);
            this.state.room.data.lastMessage = null;
            this.setState({room: this.state.room, newMessage: ''});
        }
    }
    //#endregion

    render(_, { room, messages, newMessage, lobbyViewToggled }) {
        if (!room) return;
        const isUserAdmin = room.data.adminId === Socket.socket.id;
        return (
            <div class="room">
                <div class="room__game"
                    id={'game'}
                    style={room.playing && !lobbyViewToggled ? '' : 'display:none;'}>
                    <GamePage room={room}></GamePage>
                </div>
                <div class="room__configuration"
                    style={room.playing && !lobbyViewToggled ? 'display:none;' : ''}>
                    <div class="room__head">
                        <div class="room__head__title">{room.name}</div>
                        <div class="room__head__actions">
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
                    </div>
                    <div class="room__body">
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
                        <div class="room__foot__option"
                            style={room.playing ? 'display:none;' : ''}>
                            <button class="room__foot__option__button"
                                onClick={(e) => this.startGame()}>
                                Start Game!
                            </button>
                        </div>
                        <div class="room__foot__option"
                            style={room.playing ? '' : 'display:none;'}>
                            <button class="room__foot__option__button"
                                onClick={(e) => this.endGame()}>
                                Stop Game!
                            </button>
                        </div>
                    </div>
                </div>
                <div class="room__chat">
                    <div class="room__chat__messages">
                        {   ...(messages.map(item => 
                            <div class="room__chat__message">
                                <div>{item.avatar}</div>
                                <div>{item.nick}</div>: 
                                <div class="room__chat__message__value">{item.value}</div>
                            </div>
                            ))
                        }
                    </div>
                    <div class="room__chat__input-field">
                        <label class="room__chat__label">Wyślij wiadomość</label>
                        <input class="room__chat__input"
                            value={newMessage}
                            placeholder="wyślij wiadomość"
                            onKeyUp={(e) => this.sendMessage(e)}
                            onInput={(e) => this.onNewMessageChange(e)}/>
                    </div>
                </div>

            </div>
        );
    }
}