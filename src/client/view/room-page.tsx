import { render, h, Component } from 'preact';

export default class RoomPage extends Component {
    state = {
        config: { name: 'Nazwa pokoju'}
    };

    componentDidMount() {
        
    }

    onTimeLimitChange(e: any): void {
        this.setState({ nick: e.target.value });
    };

    onScoreLimitChange(e: any): void {
        this.setState({ nick: e.target.value });
    };


    render(_, { config}) {
        return [
            <div class="lobby">
                <div class="lobby__head">
                    <div class="lobby__head__title">{config.name}</div>
                </div>
                <div class="lobby__body">
                    <div class="lobby__body__actions">
                        <button>
                            Rand
                        </button>
                        <button>
                            Reset
                        </button>
                    </div>
                    <div class="lobby__body__team">
                        <div class="lobby__body__team__label">Red</div>
                        <div class="lobby__body__team__members">
                            <div class="lobby__body__team__member">
                                <div>nick</div>
                            </div>
                        </div>
                    </div>
                    <div class="lobby__body__team">
                        <div class="lobby__body__team__label">Spectators</div>
                        <div class="lobby__body__team__members">
                            <div class="lobby__body__team__member">
                                <div>nick</div>
                            </div>
                        </div>
                    </div>
                    <div class="lobby__body__team">
                        <div class="lobby__body__team__label">Blue</div>
                        <div class="lobby__body__team__members">
                            <div class="lobby__body__team__member">
                                <div>nick</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="lobby__foot">
                    <div class="lobby__foot__option">
                        <label>Time limit</label>
                        <input
                            value={6}
                            onInput={this.onTimeLimitChange.bind(this)}/>
                    </div>
                    <div class="lobby__foot__option">
                        <label>Score limit</label>
                        <input
                            value={10}
                            onInput={this.onScoreLimitChange.bind(this)}/>
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