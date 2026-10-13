import {
    DEFAULT_AVATAR,
    LEGENDARY_AVATARS,
    POPULAR_AVATARS,
    validAvatar,
} from '../../shared/game/avatars';
import { avatarToBase64 } from '../game/avatarImage';
import { LobbyClient } from './client';
import { node, button } from './dom';

export class AvatarPicker {
    readonly element = node('section', 'avatar-picker');
    private input = node('input');
    private preview = node('img', 'avatar-preview');
    private choices: HTMLButtonElement[] = [];
    constructor(private client: LobbyClient) {
        const label = node('label', 'field', 'Twój avatar (emoji)');
        this.input.value = client.avatar;
        this.input.maxLength = 32;
        this.input.setAttribute('aria-label', 'Twój avatar (emoji)');
        this.preview.alt = 'Podgląd avatara';
        const row = node('div', 'avatar-input');
        row.append(this.preview, this.input);
        label.append(row);
        this.element.append(label);
        const palette = node('details', 'avatar-palette');
        palette.append(node('summary', '', 'Wybierz emoji'));
        for (const [title, values] of [
            ['Legendarni gracze — throw_old', LEGENDARY_AVATARS],
            ['Popularne emoji', POPULAR_AVATARS],
        ] as const) {
            palette.append(node('h3', '', title));
            const grid = node('div', 'emoji-grid');
            for (const emoji of values) {
                const choice = button(emoji, () => {
                    this.input.value = emoji;
                    this.update();
                });
                choice.classList.add('emoji-choice');
                choice.setAttribute('aria-label', `Avatar ${emoji}`);
                choice.dataset.emoji = emoji;
                grid.append(choice);
                this.choices.push(choice);
            }
            palette.append(grid);
        }
        this.element.append(palette, node('p', 'muted', 'Wybierz z listy lub wklej jedno emoji.'));
        this.input.oninput = () => this.update();
        this.update();
    }
    validate() {
        const valid = validAvatar(this.input.value.trim());
        if (!valid) {
            this.client.error = 'Wybierz lub wklej jedno emoji jako avatar.';
            this.input.focus();
        }
        return valid;
    }
    private update() {
        const emoji = this.input.value.trim();
        const valid = validAvatar(emoji);
        this.input.setCustomValidity(valid ? '' : 'Wpisz jedno emoji.');
        this.preview.src = avatarToBase64(valid ? emoji : DEFAULT_AVATAR);
        if (valid) this.client.setAvatar(emoji);
        for (const choice of this.choices)
            choice.setAttribute('aria-pressed', String(choice.dataset.emoji === emoji));
    }
}
