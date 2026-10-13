import { ARENAS, ARENA_SKINS, arenaSettings } from '../../shared/game/arenas';
import type { ArenaSettings } from '../../shared/game/arenas';
import type { RoomState } from '../../shared/game/lobbyProtocol';
import { LobbyClient } from './client';
import { node } from './dom';

export class ArenaPanel {
    readonly element = node('section', 'arena-panel');
    private description = node('p', 'muted');
    private editor = node('details', 'match-editor');
    private size = node('select');
    private skin = node('select');
    private save = node('button', 'button', 'Zapisz boisko');
    private key = '';
    constructor(private client: LobbyClient) {
        this.element.append(this.description, this.editor);
        const form = node('form', 'arena-settings');
        this.editor.append(node('summary', '', 'Boisko i wygląd'), form);
        for (const [select, title, choices] of [
            [this.size, 'Wariant boiska', ARENAS],
            [this.skin, 'Wygląd boiska', ARENA_SKINS],
        ] as const) {
            const label = node('label', 'field', title);
            select.setAttribute('aria-label', title);
            for (const [value, choice] of Object.entries(choices)) {
                const option = node('option', '', choice.name);
                option.value = value;
                select.append(option);
            }
            label.append(select);
            form.append(label);
        }
        this.save.type = 'submit';
        form.append(this.save);
        form.onsubmit = (event) => {
            event.preventDefault();
            client.send({
                type: 'arena',
                arena: { id: this.size.value, skin: this.skin.value } as ArenaSettings,
            });
        };
    }
    render(room: RoomState) {
        const settings = arenaSettings(room.arena),
            shape = ARENAS[settings.id];
        this.description.textContent = `${shape.name} · ${shape.width} × ${shape.height} · ${ARENA_SKINS[settings.skin].name}`;
        this.editor.hidden = room.running || room.hostId !== this.client.id;
        if (room.running) this.editor.open = false;
        this.save.disabled = this.size.disabled = this.skin.disabled = !this.client.connected;
        const key = JSON.stringify([room.id, settings]);
        if (key !== this.key) {
            this.key = key;
            this.size.value = settings.id;
            this.skin.value = settings.skin;
        }
    }
}
