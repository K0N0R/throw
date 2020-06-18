import { render, h, Component } from 'preact';
import ListPage from './lobby-page';
import { User } from './../models/user';

export default class StartPage extends Component {
    state = {
        nick: window.localStorage.getItem('throw_nick') || '',
        avatar: window.localStorage.getItem('throw_avatar') || ''
    };

    componentDidMount() {

    }
    
    onConfirm(): void {
        if (this.state.nick && this.state.avatar) {
            window.localStorage.setItem('throw_avatar', this.state.avatar);
            window.localStorage.setItem('throw_nick', this.state.nick);
            User.connect(this.state.nick, this.state.avatar, () => {
                render(<ListPage />, document.getElementById('app') as Element);
            });
        }
    }

    onNickChange(e: any): void {
        this.setState({ nick: e.target.value });
    };

    onAvatarChange(e: any): void {
        this.setState({ avatar: e.target.value });
    }

    render(_, { nick, avatar}) {
        return [
            <div class="dialog">
                <div class="form-field">
                    <label>Nick</label>
                    <input
                        value={nick}
                        onInput={this.onNickChange.bind(this)}/>
                </div>
                <div class="form-field-avatar">
                    <label>Avatar</label>
                    <div class="display--flex">
                        <input
                            value={avatar}
                            onInput={this.onAvatarChange.bind(this)}/>
                        <a class="link"
                            target="_blank"
                            href="https://getemoji.com/">
                                Where do i find cool avatar?
                        </a>
                    </div>
                </div>

                <button 
                    class="form-btn form-btn-submit"
                    onClick={this.onConfirm.bind(this)}>
                    Throw!
                </button>

            </div>
        ];
    }
}