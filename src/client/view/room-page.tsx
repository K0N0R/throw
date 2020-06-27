import { h, Component, render } from 'preact';
import { ILobbyRoom, IRoomDataMessage as IRoomMessage } from './../../shared/events';
import { User } from '../models/socket';
import { Team } from '../../shared/team';
import GamePage from './game-page';
import ConfigurationPage from './configuration-page';
import { goTo } from './utils';
import LobbyPage from './lobby-page';
import { KeysHandler } from '../../shared/keysHandler';
import { MapKind } from '../../shared/callibration';

interface IRoomState {
    room: ILobbyRoom;
    messages: IRoomMessage[];
    messageToSend: string;
    mapKinds: MapKind[];
    configOverlayOnTop: boolean;
}

export default class RoomPage extends Component<{ room: ILobbyRoom}, IRoomState> {
    //#region hooks
    componentDidMount() {
        const config =  { ... KeysHandler.configuration };
        const initMessages = [
            {
                value: `UP(${config.up}), DOWN(${config.down}), LEFT(${config.left}), RIGHT(${config.right})`,
                nick: 'MOVEMENT',
                avatar: '🛠️'
            }, {
                 value: `SHOOT(${config.shoot}), DASH(${config.dash})`,
                nick: `ACTIONS`,
                avatar: '🛠️'
            },
        ];
        const initMapKinds = [
            MapKind.ROUNDED,
            MapKind.ROUNDED_MEDIUM,
            MapKind.ROUNDED_BIG
        ]
        this.setState({ messages: initMessages, mapKinds: initMapKinds });
        this.bindSocket();

        this.onRoomChanged(this.props.room);
        setTimeout(() => {
            (document.querySelector('#room') as HTMLElement)?.focus();
        });
    }
    //#endregion

    //#region init
    onLobbyKey(e): void {
        if (e.code === 'Escape') {
            if (this.state.room.playing) {
                this.setState({ configOverlayOnTop: !this.state.configOverlayOnTop});
            }
        }
        if (e.code === 'Enter') {
            setTimeout(() => {
                (document.querySelector('#chat-input') as HTMLElement)?.focus();
            });
        }
    }

    openConfiguration(): void {
        const element = document.querySelector('#configuration')
        if (!element) return;
        render(<ConfigurationPage/>, element)
    }

    bindSocket(): void {
        const onRoomChanged = (room: ILobbyRoom) => {
            this.onRoomChanged(room);
        };
        User.socket.on('room::changed', onRoomChanged);
        const onNewMessage = (message: IRoomMessage) => {
            this.addNewMessage(message);
        }
        User.socket.on('room::new-message', onNewMessage)

        const onUserLeftRoom = () => {
            this.onUserLeftRoom();
            onDispose();
        };
        User.socket.on('room::user-left', onUserLeftRoom);

        const onRoomDestroyed = () => {
            this.onRoomDestroy();
            onDispose();
        };
        User.socket.on('room::destroyed', onRoomDestroyed);

        const onDispose = () => {
            User.socket.off('room::changed', onRoomChanged);
            User.socket.off('room::new-message', onRoomChanged);
            User.socket.off('room::user-left', onUserLeftRoom);
            User.socket.off('room::destroyed', onRoomDestroyed);
        };
    }

    updateRoom(): void {
        User.socket.emit('room::update', this.state.room);
    }
    onRoomChanged(newValue: ILobbyRoom): void {
        this.setState({ room: newValue });
        this.forceUpdate();
    }

    leaveRoom(): void {
        User.socket.emit('room::user-leave');
    }
    onUserLeftRoom(): void {
        goTo(<LobbyPage/>);
    }

    onRoomDestroy(): void {
        goTo(<LobbyPage/>);
    }
    //#endregion

    //#region params change
    onTimeLimitChange(e: any): void {
        this.state.room.timeLimit = e.target.value;
        this.updateRoom();
    };
    
    onScoreLimitChange(e: any): void {
        this.state.room.scoreLimit = e.target.value;
        this.updateRoom();
    };

    onMapKindChange(e: any): void {
        this.state.room.mapKind = e.target.value;
        this.updateRoom();
    };
    //#endregion

    //#region user team change
    drag(ev, user): void {
        if (this.state.room.adminId !== User.socket.id) return;
        ev.dataTransfer.setData('userId', user.socketId);
    }

    dragOver(ev): void {
        if (this.state.room.adminId !== User.socket.id) return;
        ev.preventDefault();
    }

    drop(ev, team): void {
        if (this.state.room.adminId !== User.socket.id) return;
        ev.preventDefault();
        const userId = ev.dataTransfer.getData('userId')
        const user = this.state.room.users.find(user => user.socketId === userId);
        if (!user) return;
        user.team = team;
        this.updateRoom();
    }

    rand(): void {
        if (this.state.room.adminId !== User.socket.id) return;
        if (this.state.room) {
            const users = this.state.room.users;
            users.forEach(user => user.team = Team.Spectator);
            const teamMax = Math.ceil(users.length / 2);
            users.forEach(user => {
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
            this.updateRoom();
        }
    }

    reset(): void {
        if (this.state.room.adminId !== User.socket.id) return;
        this.state.room.users.forEach((user) => {
            user.team = Team.Spectator;
        });
        this.updateRoom();
    }
    //#endregion

    //#region game
    startGame(): void {
        if (this.state.room.adminId !== User.socket.id) return;
        this.state.room.playing = true;
        this.updateRoom();
    }

    endGame(): void {
        if (this.state.room.adminId !== User.socket.id) return;
        this.state.room.playing = false;
        this.setState({ configOverlayOnTop: false});
        this.updateRoom();
    }
    //#endregion

    //#region chat
    addNewMessage(message: IRoomMessage): void {
        this.state.messages.push(message);
        this.forceUpdate();
        setTimeout(() => { //scroll to last meessage
            const messagesEl = document.querySelector('.room__chat__messages')
            if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
        })
    }

    onMessageToSendChange(e: any): void {
        this.setState({ messageToSend: e.target.value});
    };

    onMessageKeyConfirm(e): void {
        if (e.key !== 'Enter' || !this.state.messageToSend) return;
        this.sendMessage();
        setTimeout(() => {
            (document.querySelector('#room') as HTMLElement)?.focus();
        });
    }

    sendMessage(): void {
        if (!this.state.messageToSend) return;
        User.socket.emit('room::user-message', { nick: User.nick, avatar: User.avatar, value: this.state.messageToSend });
        this.setState({ messageToSend: ''});
    }
    //#endregion

    render(_, state: IRoomState) {
        if (!state.room) return;
        const isUserAdmin = state.room.adminId === User.socket.id;
        return (
            <div class="room">
                <button class="room__config-button form-btn form-btn--small form-btn--accent"
                    onClick={() => this.openConfiguration()}>
                    🛠️ Configuration 🛠️
                </button>
                <div id="configuration"></div>
                <div class="room"
                    id="room"
                    tabIndex={-1}
                    onKeyDown={(e) => this.onLobbyKey(e)}>
                    <div class="room__game"
                        id="game"
                        style={state.room.playing && !state.configOverlayOnTop ? '' : 'display:none;'}>
                        <GamePage room={state.room}></GamePage>
                    </div>
                    <div class="dialog room__configuration"
                        style={state.room.playing && !state.configOverlayOnTop ? 'display:none;' : ''}>

                        <div class="room__head">
                            <div class="room__head__title">
                                {state.room.name}
                            </div>
                            <div class="room__head__row">
                                <button class="form-btn form-btn--small"
                                    onClick={() => this.leaveRoom()}>
                                    Leave
                                </button>
                                {isUserAdmin &&
                                <div class="room__head__row">
                                    <button class="form-btn form-btn--small"
                                        onClick={() => this.rand()}
                                        disabled={state.room.playing}>
                                        Rand
                                    </button>
                                    <button class="form-btn form-btn--small"
                                        onClick={() => this.reset()}
                                        disabled={state.room.playing}>
                                        Reset
                                    </button>
                                </div>
                                }
                            </div>
                        </div>
                        <div class="room__body">
                            <div class="room__body__team room__body__team--red"
                                onDrop={(ev) => this.drop(ev, Team.Left)}
                                onDragOver={(ev) => this.dragOver(ev)}>

                                <div class="room__body__team__label">Red</div>
                                <div class="room__body__team__members"
                                    >
                                    {   ...(state.room.users.filter(user => user.team === Team.Left).map(item => 
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
                                    {   ...(state.room.users.filter(user => user.team === Team.Spectator).map(item => 
                                        <div class="room__body__team__member"
                                            onDragStart={(e) => this.drag(e, item)} draggable={true}>
                                            <div>{item.avatar}</div>
                                            <div>{item.nick}</div>
                                        </div>
                                        ))
                                    }
                                </div>
                            </div>
                            <div class="room__body__team room__body__team--blue"
                                onDragOver={(ev) => this.dragOver(ev)}
                                onDrop={(ev) => this.drop(ev, Team.Right)}>
                                <div class="room__body__team__label">Blue</div>
                                    <div class="room__body__team__members">
                                    {   ...(state.room.users.filter(user => user.team === Team.Right).map(item => 
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
                            <div class="form-field form-field--small form-field--horizontal room__foot__option">
                                <label class="room__foot__option__label">Time limit</label>
                                <input class="room__foot__option__input"
                                    value={state.room.timeLimit}
                                    readOnly={!isUserAdmin || state.room.playing}
                                    onInput={(e) => this.onTimeLimitChange(e)}/>
                            </div>
                            <div class="form-field form-field--small form-field--horizontal room__foot__option">
                                <label class="room__foot__option__label">Score limit</label>
                                <input class="room__foot__option__input"
                                    value={state.room.scoreLimit}
                                    readOnly={!isUserAdmin || state.room.playing}
                                    onInput={(e) => this.onScoreLimitChange(e)}/>
                            </div>
                            <div class="form-field form-field--small form-field--horizontal room__foot__option">
                                <label class="room__foot__option__label">Map</label>
                                <select class="room__foot__option__input"
                                    value={state.room.mapKind}
                                    readOnly={!isUserAdmin || state.room.playing}
                                    onInput={(e) => this.onMapKindChange(e)}>
                                        {   ...(state.mapKinds.map(item => 
                                            <option value={item}>
                                                {item}
                                            </option>
                                            ))
                                        }
                                </select>
                            </div>
                            { isUserAdmin &&
                            <div class="room__foot__option"
                                style={state.room.playing ? 'display:none;' : ''}>
                                <button class="form-btn form-btn-submit form-btn-submit--primary"
                                    onClick={(e) => this.startGame()}
                                    disabled={state.room.playing}>
                                    Start Game!
                                </button>
                            </div>
                            }
                            { isUserAdmin &&
                            <div class="room__foot__option"
                                style={state.room.playing ? '' : 'display:none;'}>
                                <button class="form-btn form-btn-submit form-btn-submit--primary"
                                    onClick={(e) => this.endGame()}
                                    disabled={!state.room.playing}>
                                    Stop Game!
                                </button>
                            </div>
                            }
                        </div>
                    </div>
                    <div class="dialog room__chat">
                        <div class="room__chat__messages">
                            {   ...(state.messages.map(item => 
                                <div className={`room__chat__message ${item.avatar === 'SYSTEM' ? 'room__chat__message--system' : ''} `}>
                                    <div>{item.avatar}</div>
                                    <div>{item.nick}</div>: 
                                    <div class="room__chat__message__value">{item.value}</div>
                                </div>
                                ))
                            }
                        </div>
                        <div class="form-field form-field--small form-field--flat form-field--horizontal room__chat__input-field">
                            <label class="room__chat__label">Wyślij wiadomość</label>
                            <input class="room__chat__input"
                                id="chat-input"
                                value={state.messageToSend}
                                placeholder="send message"
                                onKeyUp={(e) => this.onMessageKeyConfirm(e)}
                                onInput={(e) => this.onMessageToSendChange(e)}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}