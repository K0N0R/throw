import { h } from 'preact';
import { useState } from 'preact/hooks';
import { KeysHandler, KeysConfiguration } from './../../shared/keysHandler';
import { useLocalStorage } from './hooks';

enum MovementKind {
    WSAD = "WSAD", 
    ARROW = "ARROW",
    CUSTOM = "CUSTOM"
}

export default function ConfigurationPage() {

    const [kind, setKind] = useLocalStorage('thow_config_set', MovementKind.ARROW);
    const [, setKeysConfig] = useLocalStorage('throw_config', '');
    const [shoot, setShoot] = useState(KeysHandler.configuration.shoot);
    const [dash, setDash] = useState(KeysHandler.configuration.dash);
    const [up, setUp] = useState(KeysHandler.configuration.up);
    const [down, setDown] = useState(KeysHandler.configuration.down);
    const [left, setLeft] = useState(KeysHandler.configuration.left);
    const [right, setRight] = useState(KeysHandler.configuration.right);
    const kinds = [
        MovementKind.ARROW,
        MovementKind.WSAD,
        MovementKind.CUSTOM
    ];

    const saveConfig = () => {
        if (shoot && dash && up && down && left && right) {
            const config: KeysConfiguration = {
                shoot,
                dash,
                up,
                down,
                left,
                right,
            };
            setKeysConfig(config);
            KeysHandler.setConfiguration();
            destroy();
       }
    }

    const cancel = () => {
        destroy();
    }

    const destroy = () => {
        const configuration = document.querySelector('#configuration');
        if (!configuration) return;
        configuration.innerHTML = '';
    }

    //#region params change
    const onMovementKindChange = (e: any) => {
        switch (e.target.value) {
            case MovementKind.ARROW:
                setKind(e.target.value);
                setUp('ArrowUp');
                setDown('ArrowDown');
                setLeft('ArrowLeft');
                setRight('ArrowRight');
                break;

            case MovementKind.WSAD:
                setKind(e.target.value);
                setUp('KeyW');
                setDown('KeyS');
                setLeft('KeyA');
                setRight('KeyD');
                break;

            default:
                setKind(e.target.value);
        }
    };

    const onMovementUpChange = (e: KeyboardEvent) => {
        e.preventDefault();
        setUp(e.code);
    };

    const onMovementDownChange = (e: any) => {
        e.preventDefault();
        setDown(e.code);
    };

    const onMovementLeftChange = (e: any) => {
        e.preventDefault();
        setLeft(e.code);
    };

    const onMovementRightChange = (e: any) => {
        e.preventDefault();
        setRight(e.code);
    };

    const onShootChange = (e: any) => {
        e.preventDefault();
        setShoot(e.code);
    };

    const onDashChange = (e: any) => {
        e.preventDefault();
        setDash(e.code);
    };

    return (
        <div class="dialog dialog--fixed">
            <div class="room__foot__option">
                <div class="form-field form-field--small form-field--horizontal room__foot__option">
                    <label class="room__foot__option__label">Movement</label>
                    <select class="room__foot__option__input"
                        value={kind}
                        onChange={onMovementKindChange}>
                            {
                                ...kinds.map(item =>
                                    <option value={item} selected={item === kind}>
                                        {item}
                                    </option>
                                )
                            }

                    </select>
                </div>
            </div>
            { kind === MovementKind.CUSTOM &&
                <div>
                    <div class="room__foot__option">
                        <div class="form-field form-field--small form-field--horizontal room__foot__option">
                            <label class="room__foot__option__label">MOVE UP</label>
                            <input class="room__foot__option__input"
                                value={up}
                                onKeyDown={onMovementUpChange}/>
                        </div>
                    </div>
                    <div class="room__foot__option">
                        <div class="form-field form-field--small form-field--horizontal room__foot__option">
                            <label class="room__foot__option__label">MOVE DOWN</label>
                            <input class="room__foot__option__input"
                                value={down}
                                onKeyDown={onMovementDownChange}/>
                        </div>
                    </div>
                    <div class="room__foot__option">
                        <div class="form-field form-field--small form-field--horizontal room__foot__option">
                            <label class="room__foot__option__label">MOVE LEFT</label>
                            <input class="room__foot__option__input"
                                value={left}
                                onKeyDown={onMovementLeftChange}/>
                        </div>
                    </div>
                    <div class="room__foot__option">
                        <div class="form-field form-field--small form-field--horizontal room__foot__option">
                            <label class="room__foot__option__label">MOVE RIGHT</label>
                            <input class="room__foot__option__input"
                                value={right}
                                onKeyDown={onMovementRightChange}/>
                        </div>
                    </div>
                </div>
            }
            <div class="room__foot__option">
                <div class="form-field form-field--small form-field--horizontal room__foot__option">
                    <label class="room__foot__option__label">SHOOT</label>
                    <input class="room__foot__option__input"
                        value={shoot}
                        onKeyDown={onShootChange}/>
                </div>
            </div>
            <div class="room__foot__option">
                <div class="form-field form-field--small form-field--horizontal room__foot__option">
                    <label class="room__foot__option__label">DASH</label>
                    <input class="room__foot__option__input"
                        value={dash}
                        onKeyDown={onDashChange}/>
                </div>
            </div>
            <div class="room__foot__option">
                <button class="form-btn form-btn-submit form-btn-submit--primary"
                    onClick={cancel}>
                    Cancel 😢
                </button>
            </div>
            <div class="room__foot__option">
                <button class="form-btn form-btn-submit form-btn-submit--primary"
                    onClick={saveConfig}>
                    Save config
                </button>
            </div>
        </div>
    );
}