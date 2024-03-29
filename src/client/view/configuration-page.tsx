import { h } from 'preact';
import { useState } from 'preact/hooks';
import { KeysHandler, KeysConfiguration } from './../../shared/keysHandler';
import { useLocalStorage } from './hooks';
import { setSoundVolume } from './utils';

enum MovementKind {
    WSAD = "WSAD", 
    ARROW = "ARROW",
    CUSTOM = "CUSTOM"
}

export default function ConfigurationPage(props: { hide: () => void}) {

    const [kind, setKind] = useLocalStorage('throw_config_set', MovementKind.ARROW);
    const [, setKeysConfig] = useLocalStorage('throw_config', '');
    const [shoot, setShoot] = useState(KeysHandler.configuration.shoot);
    const [dash, setDash] = useState(KeysHandler.configuration.dash);
    const [up, setUp] = useState(KeysHandler.configuration.up);
    const [down, setDown] = useState(KeysHandler.configuration.down);
    const [left, setLeft] = useState(KeysHandler.configuration.left);
    const [right, setRight] = useState(KeysHandler.configuration.right);
    const [camera1, setCamera1] = useState(KeysHandler.configuration.camera1);
    const [camera2, setCamera2] = useState(KeysHandler.configuration.camera2);
    const [camera3, setCamera3] = useState(KeysHandler.configuration.camera3);
    const [backgroundVolume, setBackgroundVolume] = useLocalStorage('throw_config_background_volume', 0.5);
    const kinds = [
        MovementKind.ARROW,
        MovementKind.WSAD,
        MovementKind.CUSTOM
    ];

    const saveConfig = () => {
        if (shoot && dash && up && down && left && right && camera1 && camera2 && camera3) {
            const config: KeysConfiguration = {
                shoot,
                dash,
                up,
                down,
                left,
                right,
                camera1,
                camera2,
                camera3,
            };
            setKeysConfig(config);
            KeysHandler.setConfiguration();
            props.hide();
       }
    }

    const cancel = () => {
        props.hide();
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

    const onCamera1Change = (e: any) => {
        e.preventDefault();
        setCamera1(e.code);
    };

    const onCamera2Change = (e: any) => {
        e.preventDefault();
        setCamera2(e.code);
    };

    const onCamera3Change = (e: any) => {
        e.preventDefault();
        setCamera3(e.code);
    };

    const onBackgroundVolumeChange = (e: any) => {
        e.preventDefault();
        setBackgroundVolume(Number(e.target.value));
        setSoundVolume('#background-sound', Number(e.target.value));
    };

    return (
        <div class="dialog dialog--fixed">
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
            { kind === MovementKind.CUSTOM &&
                <div>
                    <div class="form-field form-field--small form-field--horizontal room__foot__option">
                        <label class="room__foot__option__label">MOVE UP</label>
                        <input class="room__foot__option__input"
                            value={up}
                            onKeyDown={onMovementUpChange}/>
                    </div>

                    <div class="form-field form-field--small form-field--horizontal room__foot__option">
                        <label class="room__foot__option__label">MOVE DOWN</label>
                        <input class="room__foot__option__input"
                            value={down}
                            onKeyDown={onMovementDownChange}/>
                    </div>
                    <div class="form-field form-field--small form-field--horizontal room__foot__option">
                        <label class="room__foot__option__label">MOVE LEFT</label>
                        <input class="room__foot__option__input"
                            value={left}
                            onKeyDown={onMovementLeftChange}/>
                    </div>
                    <div class="form-field form-field--small form-field--horizontal room__foot__option">
                        <label class="room__foot__option__label">MOVE RIGHT</label>
                        <input class="room__foot__option__input"
                            value={right}
                            onKeyDown={onMovementRightChange}/>
                    </div>
                </div>
            }
            <div class="form-field form-field--small form-field--horizontal room__foot__option">
                <label class="room__foot__option__label">SHOOT</label>
                <input class="room__foot__option__input"
                    value={shoot}
                    onKeyDown={onShootChange}/>
            </div>
            <div class="form-field form-field--small form-field--horizontal room__foot__option">
                <label class="room__foot__option__label">DASH</label>
                <input class="room__foot__option__input"
                    value={dash}
                    onKeyDown={onDashChange}/>
            </div>
            <div class="form-field form-field--small form-field--horizontal room__foot__option">
                <label class="room__foot__option__label">CAMERA 1</label>
                <input class="room__foot__option__input"
                    value={camera1}
                    onKeyUp={onCamera1Change}/>
            </div>
            <div class="form-field form-field--small form-field--horizontal room__foot__option">
                <label class="room__foot__option__label">CAMERA 2</label>
                <input class="room__foot__option__input"
                    value={camera2}
                    onKeyUp={onCamera2Change}/>
            </div>
            <div class="form-field form-field--small form-field--horizontal room__foot__option">
                <label class="room__foot__option__label">CAMERA 3</label>
                <input class="room__foot__option__input"
                    value={camera3}
                    onKeyUp={onCamera3Change}/>
            </div>
            <div class="text--right margin--huge-top">
                SOUNDS
            </div>
            <div class="form-field form-field--small form-field--horizontal room__foot__option">
                <label class="room__foot__option__label">BACKGROUND VOLUME</label>
                <input class="room__foot__option__input"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={backgroundVolume}
                    onChange={onBackgroundVolumeChange}/>
            </div>
            <button class="button button"
                onClick={cancel}>
                Close
            </button>
            <button class="button button--primary"
                onClick={saveConfig}>
                Save config
            </button>
        </div>
    );
}