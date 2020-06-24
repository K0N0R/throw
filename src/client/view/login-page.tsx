import { h } from 'preact';
import ListPage from './lobby-page';
import { Socket } from '../models/socket';
import { useLocalStorage } from './hooks';
import { goTo } from './utils';

export default function StartPage() {
    const [nick, setNick] = useLocalStorage('throw_nick', '');
    const [avatar, setAvatar] = useLocalStorage('throw_avatar', '');
    
    const onConfirm = () => {
        if (nick && avatar) {
            Socket.connect(nick, avatar, () => {
                goTo(<ListPage />);
            });
        }
    }

    return (
        <div class="dialog">
            <div class="form-field">
                <label>Nick</label>
                <input
                    value={nick}
                    maxLength={20}
                    onInput={(e) => setNick((e.target as HTMLInputElement).value)}/>
            </div>
            <div class="form-field form-field--avatar">
                <label>Avatar</label>
                <div>
                    <input
                        value={avatar}
                        maxLength={2}
                        onInput={(e) => setAvatar((e.target as HTMLInputElement).value)}/>
                    <a class="link"
                        target="_blank"
                        href="https://getemoji.com/">
                            Where do i find cool avatar?
                    </a>
                </div>
            </div>

            <button
                class="form-btn form-btn-submit"
                onClick={onConfirm}>
                Throw!
            </button>

        </div>
    );
}