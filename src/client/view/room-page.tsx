import { h, Component, render } from 'preact';
import { IRoomUser, IRoomGameParams, IRoomMessage, IRoom, IRoomState } from './../../shared/events';
import { User } from '../models/socket';
import { Team } from '../../shared/team';
import GamePage from './game-page';
import ConfigurationPage from './configuration-page';
import { goTo, playSound } from './utils';
import LobbyPage from './lobby-page';
import { KeysHandler } from '../../shared/keysHandler';
import { MapKind } from '../../shared/callibration';

interface IRoomComponentState {
    users: IRoomUser[];
    gameRunning: boolean;
    gameParams: IRoomGameParams;
    messages: IRoomMessage[];
    messageToSend: string;
    mapKinds: MapKind[];
    configOverlayOnTop: boolean;
}

export default class RoomPage extends Component<IRoomState, IRoomComponentState> {
    //#region hooks
    componentDidMount() {
        const config =  { ... KeysHandler.configuration };
        const initMessages = [
            {
                value: `MOVE_UP(${config.up}), MOVE_DOWN(${config.down}), MOVE_LEFT(${config.left}), MOVE_RIGHT(${config.right})`,
                nick: '',
                avatar: 'SYSTEM'
            }, {
                value: `SHOOT(${config.shoot}), DASH(${config.dash})`,
                nick: ``,
                avatar: 'SYSTEM'
            }, {
                value: `CAM_CLOSE(${config.camera1}), CAM_MEDIUM(${config.camera2}), CAM_FAR(${config.camera3}) `,
                nick: ``,
                avatar: 'SYSTEM'
            }
        ];
        const initMapKinds = [
            MapKind.ROUNDED,
            MapKind.ROUNDED_MEDIUM,
            MapKind.ROUNDED_BIG
        ]
        this.setState({
            users: this.props.users,
            gameParams: this.props.gameParams,
            gameRunning: this.props.gameRunning,
            messages: initMessages,
            mapKinds: initMapKinds
        });
        this.bindSocket();

        setTimeout(() => {
            (document.querySelector('#room') as HTMLElement)?.focus();
        });
    }
    //#endregion

    //#region init
    bindSocket(): void {

        const onUserChange = (user: IRoomUser) => {
            const idx = this.state.users.findIndex(item => item.socketId === user.socketId);
            if (idx === -1) return;
            this.state.users[idx].team = user.team;
            if (User.socket.id === user.socketId) {
                User.team = user.team;
            }
            this.forceUpdate();
        };
        User.socket.on('room::user::changed-team', onUserChange);

        const onUserAdd = (user: IRoomUser) => {
            const idx = this.state.users.findIndex(item => item.socketId === user.socketId);
            if (idx !== -1) return;
            this.state.users.push(user);
            this.forceUpdate();
            playSound(`#user-joined-sound`);
        };
        User.socket.on('room::user::add', onUserAdd);

        const onUserLeftRoom = (user: IRoomUser) => {
            if (User.socket.id === user.socketId) {
                this.onUserLeftRoom();
            } else {
                const idx = this.state.users.findIndex(item => item.socketId === user.socketId);
                if (idx === -1) return;
                this.state.users.splice(idx, 1);
                this.forceUpdate();
                playSound(`#user-left-sound`);
            }
        };
        User.socket.on('room::user::left', onUserLeftRoom);

        const onGameParamsState = (data: IRoomGameParams) => {
            if (data.mapKind != null) {
                this.state.gameParams.mapKind = data.mapKind;
            }
            if (data.scoreLimit != null) {
                this.state.gameParams.scoreLimit = data.scoreLimit;
            }
            if (data.timeLimit != null) {
                this.state.gameParams.timeLimit = data.timeLimit;
            }
        }
        User.socket.on('room::game::params-state', onGameParamsState)

        const onNewMessage = (message: IRoomMessage) => {
            this.addNewMessage(message);
        }
        User.socket.on('room::user::messaged', onNewMessage)

        const onGameStart = () => {
            playSound(`#game-start-sound`);
            this.setState({ gameRunning: true });
        }
        User.socket.on('room::game::started', onGameStart)

        const onGameStop = () => {
            this.setState({ gameRunning: false });
        }
        User.socket.on('room::game::stopped', onGameStop)

        const onRoomDestroyed = () => {
            this.onRoomDestroy();
            onDispose();
        };
        User.socket.on('room::destroyed', onRoomDestroyed);

        const onDispose = () => {
            User.socket.off('room::user::changed-team', onUserChange);
            User.socket.off('room::user::add', onUserAdd);
            User.socket.off('room::user::left', onUserLeftRoom);
            User.socket.off('room::user::messaged', onNewMessage);
            User.socket.off('room::destroyed', onRoomDestroyed);
        };
    }

    setRoomState(roomState: IRoomState): void {
        this.setState({...roomState});
    }

    leaveRoom(): void {
        User.socket.emit('room::user::leave');
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
        this.state.gameParams.timeLimit = e.target.value;
        User.socket.emit('room::game::params', { timeLimit: this.state.gameParams.timeLimit });
    };
    
    onScoreLimitChange(e: any): void {
        this.state.gameParams.scoreLimit = e.target.value;
        User.socket.emit('room::game::params', { scoreLimit: this.state.gameParams.scoreLimit });
    };

    onMapKindChange(e: any): void {
        this.state.gameParams.mapKind = e.target.value;
        User.socket.emit('room::game::params', { mapKind: this.state.gameParams.mapKind });
    };
    //#endregion

    //#region user team change
    drag(ev, user): void {
        if (this.props.room.adminId !== User.socket.id) return;
        ev.dataTransfer.setData('userId', user.socketId);
    }

    dragOver(ev): void {
        if (this.props.room.adminId !== User.socket.id) return;
        ev.preventDefault();
    }

    drop(ev, team): void {
        if (this.props.room.adminId !== User.socket.id) return;
        ev.preventDefault();
        const userId = ev.dataTransfer.getData('userId')
        const user = this.state.users.find(user => user.socketId === userId);
        if (!user) return;
        user.team = team;
        User.socket.emit('room::user::change-team', user);
    }

    rand(): void {
        if (this.props.room.adminId !== User.socket.id) return;
        const users = this.state.users;
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
            User.socket.emit('room::user::change-team', user);
        });

    }

    reset(): void {
        if (this.props.room.adminId !== User.socket.id) return;
        this.state.users.forEach((user) => {
            user.team = Team.Spectator;
            User.socket.emit('room::user::change-team', user);
        });
    }
    //#endregion

    //#region game
    startGame(): void {
        if (this.props.room.adminId !== User.socket.id) return;
        User.socket.emit('room::game::start');
    }

    endGame(): void {
        if (this.props.room.adminId !== User.socket.id) return;
        User.socket.emit('room::game::stop');
        this.setState({ configOverlayOnTop: false});
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
        if (e.key === 'Enter' && !this.state.messageToSend) {
            (document.querySelector('#room') as HTMLElement)?.focus();
            e.stopPropagation();
        } else if (e.key !== 'Enter' || !this.state.messageToSend) return;
        this.sendMessage();
        e.stopPropagation();
        (document.querySelector('#room') as HTMLElement)?.focus();
    }

    onMessageBoxFocus(e): void {
        const user = this.state.users.find(user => user.socketId === User.socket.id);
        if (!user) return;
        user.afk = true;
        User.afk = true;
        User.socket.emit('room::user::afk', user.afk);
    }

    onMessageBoxBlur(e): void {
        const user = this.state.users.find(user => user.socketId === User.socket.id);
        if (!user) return;
        user.afk = false;
        User.afk = false;
        User.socket.emit('room::user::afk', user.afk);
    }

    sendMessage(): void {
        if (!this.state.messageToSend) return;
        User.socket.emit('room::user::message', { nick: User.nick, avatar: User.avatar, value: this.state.messageToSend });
        this.setState({ messageToSend: ''});
    }

    onLobbyKey(e): void {
        if (e.code === 'Escape') {
            if (this.state.gameRunning) {
                this.setState({ configOverlayOnTop: !this.state.configOverlayOnTop});
            }
        }
        if (e.code === 'Enter') {
            if (document.activeElement?.id !== 'chat-input') {
                (document.querySelector('#chat-input') as HTMLElement)?.focus();
            }
        }
    }

    //#region config
    openConfiguration(): void {
        const element = document.querySelector('#configuration')
        if (!element) return;
        const closeConfiguration = () => {
            render('', element)  
        }
        render(<ConfigurationPage hide={closeConfiguration}/>, element)
    }
    //#endregion

    render(props: IRoomState, state: IRoomComponentState) {
        if (!this.state.gameParams) return;
        const isUserAdmin = props.room.adminId === User.socket.id;
        return (
            <div class="room">
                <button class="button button--small button--accent button--content-size"
                    style="position: fixed;"
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
                        style={state.gameRunning && !state.configOverlayOnTop ? '' : 'display:none;'}>
                        <GamePage { ...{ gameScoreboard: props.gameScoreboard, gameRunning: props.gameRunning, gameState: props.gameState, gameParams: state.gameParams}} ></GamePage>
                    </div>
                    <div class="dialog room__configuration"
                        style={state.gameRunning && !state.configOverlayOnTop ? 'display:none;' : ''}>

                        <div class="room__head">
                            <div class="room__head__title">
                                {props.room.name}
                            </div>
                            <div class="room__head__row">
                                <button class="button button--small"
                                    onClick={() => this.leaveRoom()}>
                                    Leave
                                </button>
                                {isUserAdmin &&
                                <div class="room__head__row">
                                    <button class="button button--small"
                                        onClick={() => this.rand()}
                                        disabled={state.gameRunning}>
                                        Rand
                                    </button>
                                    <button class="button button--small"
                                        onClick={() => this.reset()}
                                        disabled={state.gameRunning}>
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
                                    {   ...(state.users.filter(user => user.team === Team.Left).map(item => 
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
                                    {   ...(state.users.filter(user => user.team === Team.Spectator).map(item => 
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
                                    {   ...(state.users.filter(user => user.team === Team.Right).map(item => 
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
                                    value={state.gameParams.timeLimit}
                                    readOnly={!isUserAdmin || state.gameRunning}
                                    onInput={(e) => this.onTimeLimitChange(e)}/>
                            </div>
                            <div class="form-field form-field--small form-field--horizontal room__foot__option">
                                <label class="room__foot__option__label">Score limit</label>
                                <input class="room__foot__option__input"
                                    value={state.gameParams.scoreLimit}
                                    readOnly={!isUserAdmin || state.gameRunning}
                                    onInput={(e) => this.onScoreLimitChange(e)}/>
                            </div>
                            <div class="form-field form-field--small form-field--horizontal room__foot__option">
                                <label class="room__foot__option__label">Map</label>
                                <select class="room__foot__option__input"
                                    value={state.gameParams.mapKind}
                                    disabled={!isUserAdmin || state.gameRunning}
                                    readOnly={!isUserAdmin || state.gameRunning}
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
                                style={state.gameRunning ? 'display:none;' : ''}>
                                <button class="button button--primary"
                                    onClick={(e) => this.startGame()}
                                    disabled={state.gameRunning}>
                                    Start Game!
                                </button>
                            </div>
                            }
                            { isUserAdmin &&
                            <div class="room__foot__option"
                                style={state.gameRunning ? '' : 'display:none;'}>
                                <button class="button button--primary"
                                    onClick={(e) => this.endGame()}
                                    disabled={!state.gameRunning}>
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
                                onBlur={(e) => this.onMessageBoxBlur(e)}
                                onFocus={(e) => this.onMessageBoxFocus(e)}
                                onKeyDown={(e) => this.onMessageKeyConfirm(e)}
                                onInput={(e) => this.onMessageToSendChange(e)}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}