export class StateMachine<TState> {
    constructor(
        public state: TState,
        private onStateChanged: (newStateValue: TState) => void,
    ) {}
    setState(state: TState) {
        if (state !== this.state) {
            this.state = state;
            this.onStateChanged(state);
        }
    }
}
