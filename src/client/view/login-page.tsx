import { h } from 'preact';
import LobbyPage from './lobby-page';
import { User } from '../models/socket';
import { useLocalStorage } from './hooks';
import { goTo } from './utils';

export default function LoginPage() {
    const [nick, setNick] = useLocalStorage('throw_nick', '');
    const [avatar, setAvatar] = useLocalStorage('throw_avatar', '');
    const nickMaxLength = 20;
    const avatarMaxLength = 2;
    
    const onConfirm = () => {
        if (nick && avatar) {
            User.connect(nick, avatar, () => {
                goTo(<LobbyPage />);
            });
        }
    }

    return (
        <div class="dialog">
            <div class="form-field">
                <label>Nick</label>
                <input
                    value={nick}
                    maxLength={nickMaxLength}
                    onInput={(e) => setNick((e.target as HTMLInputElement).value).slice(0, nickMaxLength)}/>
            </div>
            <div class="form-field form-field--avatar">
                <label>Avatar</label>
                <div class="form-field__flex">
                    <input
                        value={avatar}
                        maxLength={avatarMaxLength}
                        onInput={(e) => setAvatar((e.target as HTMLInputElement).value.slice(0, avatarMaxLength))}/>
                    <div class="legends">
                        <div >LEGENDARY PLAYERS:</div>
                        <div class="avatar">👽 👻 👥 🐗 🤖 ⚽️ 💪 🐻 😾 🐒 👴 🎯 🤡 🐴 🐍 🚽 🍍 💎 👮🏻 👨</div>
                    </div>
                </div>
            </div>
            <a class="link"
                target="_blank"
                href="https://getemoji.com/">
                    Where do i find cool avatar?
            </a>
            <button
                class="form-btn form-btn-submit"
                onClick={onConfirm}>
                Throw!
            </button>
        </div>
    );
}