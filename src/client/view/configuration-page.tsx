import { h, Component, render } from 'preact';
import { KeysHandler, KeysConfiguration } from './../../shared/keysHandler';

enum MovementKind {
    WSAD = "WSAD", 
    ARROW = "ARROW",
    CUSTOM = "CUSTOM"
}

interface IConfigurationState {
    shoot: string;
    dash: string;
    movementUp: string;
    movementDown: string;
    movementLeft: string;
    movementRight: string;
    movementKind: MovementKind;
    movementKinds: MovementKind[];

}

export default class ConfigurationPage extends Component<any, IConfigurationState> {
    //#region hooks
    componentDidMount() {
        const movementKinds = [
            MovementKind.ARROW,
            MovementKind.WSAD,
            MovementKind.CUSTOM
        ];
        this.setState({
            shoot: KeysHandler.configuration.shoot,
            dash: KeysHandler.configuration.dash,
            movementUp: KeysHandler.configuration.up,
            movementDown: KeysHandler.configuration.down,
            movementLeft: KeysHandler.configuration.left,
            movementRight: KeysHandler.configuration.right,
            movementKinds
        });
    }
    //#endregion

    saveConfig(): void {
        if (this.state.shoot && this.state.dash && this.state.movementUp && this.state.movementDown && this.state.movementLeft && this.state.movementRight) {
            const config: KeysConfiguration = {
                shoot: this.state.shoot,
                dash: this.state.dash,
                up: this.state.movementUp,
                down: this.state.movementDown,
                left: this.state.movementLeft,
                right: this.state.movementRight,
            }
            window.localStorage.setItem('throw_config', JSON.stringify(config));
            KeysHandler.setConfiguration();
            this.destroy();
       }
    }

    cancel(): void {
        this.destroy();
    }

    destroy(): void {
        const configuration = document.querySelector('#configuration');
        if (!configuration) return;
        configuration.innerHTML = '';
        (document.querySelector('#room') as HTMLElement)?.focus();
    }

    //#region params change
    onMovementKindChange(e: any): void {
        switch (e.target.value) {
            case MovementKind.ARROW:
                this.setState({
                    movementKind: e.target.value,
                    movementUp: 'ArrowUp',
                    movementDown: 'ArrowDown',
                    movementLeft: 'ArrowLeft',
                    movementRight: 'ArrowRight'
                });
                break;
            case MovementKind.WSAD:
                this.setState({
                    movementKind: e.target.value,
                    movementUp: 'KeyW',
                    movementDown: 'KeyS',
                    movementLeft: 'KeyA',
                    movementRight: 'KeyD'
                });
                break;
            default:
                this.setState({
                    movementKind: e.target.value
                });
        }
    };
    onMovementUpChange(e: KeyboardEvent): void {
        e.preventDefault();
        this.setState({movementUp: e.code});
    };
    onMovementDownChange(e: any): void {
        e.preventDefault();
        this.setState({movementDown: e.code});
    };
    onMovementLeftChange(e: any): void {
        e.preventDefault();
        this.setState({movementLeft: e.code});
    };
    onMovementRightChange(e: any): void {
        e.preventDefault();
        this.setState({movementRight: e.code});
    };
    onShootChange(e: any): void {
        e.preventDefault();
        this.setState({shoot: e.code});
    };
    onDashChange(e: any): void {
        e.preventDefault();
        this.setState({dash: e.code});
    };
    //#endregion

    render(_, state: IConfigurationState) {
        if (!state.movementKinds) return;
        return (
            <div class="dialog dialog--fixed">
                <div class="room__foot__option">
                    <div class="form-field form-field--small form-field--horizontal room__foot__option">
                        <label class="room__foot__option__label">Movement</label>
                        <select class="room__foot__option__input"
                            value={state.movementKind}
                            onInput={(e) => this.onMovementKindChange(e)}>
                                {
                                    ...state.movementKinds.map(item =>
                                        <option value={item}>
                                            {item}
                                        </option>
                                    )
                                }

                        </select>
                    </div>
                </div>
                { state.movementKind === MovementKind.CUSTOM &&
                <div>
                    <div class="room__foot__option">
                        <div class="form-field form-field--small form-field--horizontal room__foot__option">
                            <label class="room__foot__option__label">MOVE UP</label>
                            <input class="room__foot__option__input"
                                value={state.movementUp}
                                onKeyUp={(e) => this.onMovementUpChange(e)}/>
                        </div>
                    </div>
                    <div class="room__foot__option">
                        <div class="form-field form-field--small form-field--horizontal room__foot__option">
                            <label class="room__foot__option__label">MOVE DOWN</label>
                            <input class="room__foot__option__input"
                                value={state.movementDown}
                                onKeyUp={(e) => this.onMovementDownChange(e)}/>
                        </div>
                    </div>
                    <div class="room__foot__option">
                        <div class="form-field form-field--small form-field--horizontal room__foot__option">
                            <label class="room__foot__option__label">MOVE LEFT</label>
                            <input class="room__foot__option__input"
                                value={state.movementLeft}
                                onKeyUp={(e) => this.onMovementLeftChange(e)}/>
                        </div>
                    </div>
                    <div class="room__foot__option">
                        <div class="form-field form-field--small form-field--horizontal room__foot__option">
                            <label class="room__foot__option__label">MOVE RIGHT</label>
                            <input class="room__foot__option__input"
                                value={state.movementRight}
                                onKeyUp={(e) => this.onMovementRightChange(e)}/>
                        </div>
                    </div>
                </div>
                }
                <div class="room__foot__option">
                    <div class="form-field form-field--small form-field--horizontal room__foot__option">
                        <label class="room__foot__option__label">SHOOT</label>
                        <input class="room__foot__option__input"
                            value={state.shoot}
                            onKeyUp={(e) => this.onShootChange(e)}/>
                    </div>
                </div>
                <div class="room__foot__option">
                    <div class="form-field form-field--small form-field--horizontal room__foot__option">
                        <label class="room__foot__option__label">DASH</label>
                        <input class="room__foot__option__input"
                            value={state.dash}
                            onKeyUp={(e) => this.onDashChange(e)}/>
                    </div>
                </div>
                <div class="room__foot__option">
                    <button class="form-btn form-btn-submit form-btn-submit--primary"
                        onClick={(e) => this.cancel()}>
                        Cancel 😢
                    </button>
                </div>
                <div class="room__foot__option">
                    <button class="form-btn form-btn-submit form-btn-submit--primary"
                        onClick={(e) => this.saveConfig()}>
                        Save config
                    </button>
                </div>
            </div>
        );
    }
}