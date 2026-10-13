import type { RoomState } from '../../shared/game/lobbyProtocol';
import { LobbyClient } from './client';
import { node, button } from './dom';

export class MatchPanel {
    readonly element = node('section', 'match-panel');
    private clock = node('p', 'match-clock');
    private result = node('p', 'match-result');
    private name = node('input');
    private duration = node('input');
    private goals = node('input');
    private save: HTMLButtonElement;
    private form = node('form', 'match-settings');
    private editor = node('details', 'match-editor');
    private settingsKey = '';
    constructor(private client: LobbyClient) {
        this.name.maxLength = 40;
        this.name.required = true;
        this.duration.type = this.goals.type = 'number';
        this.duration.min = '0';
        this.duration.max = '3600';
        this.duration.step = '1';
        this.goals.min = '0';
        this.goals.max = '50';
        this.goals.step = '1';
        this.duration.required = this.goals.required = true;
        for (const [label, input] of [
            ['Nazwa pokoju', this.name],
            ['Czas meczu (sekundy)', this.duration],
            ['Limit goli', this.goals],
        ] as const) {
            const field = node('label', 'field', label);
            input.setAttribute('aria-label', label);
            field.append(input);
            this.form.append(field);
        }
        this.save = button('Zapisz ustawienia', () => {});
        this.save.type = 'submit';
        this.form.append(
            node(
                'p',
                'muted',
                '0 wyłącza dany limit. Czas: od 10 sekund. Co najmniej jeden limit musi być aktywny.',
            ),
            this.save,
        );
        this.form.onsubmit = (event) => {
            event.preventDefault();
            this.client.send({
                type: 'settings',
                name: this.name.value,
                settings: {
                    durationSeconds: Number(this.duration.value),
                    goalLimit: Number(this.goals.value),
                },
            });
        };
        this.editor.append(node('summary', '', 'Ustawienia meczu'), this.form);
        this.element.append(node('h2', '', 'Mecz'), this.clock, this.result, this.editor);
    }
    render(room: RoomState) {
        const { remainingSeconds: remaining, settings, result } = room.match;
        const time =
            remaining === null
                ? 'Bez limitu czasu'
                : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
        this.clock.textContent = `${time} · ${settings.goalLimit ? `do ${settings.goalLimit} goli` : 'bez limitu goli'}`;
        this.result.hidden = !result;
        this.result.textContent = result
            ? `${result.winner === 'draw' ? 'Remis' : result.winner === 'blue' ? 'Wygrywają niebiescy!' : 'Wygrywają pomarańczowi!'} ${result.score[0]} : ${result.score[1]} · ${result.reason === 'time' ? 'Koniec czasu' : 'Limit goli'}`
            : '';
        this.editor.hidden = room.running || room.hostId !== this.client.id;
        if (room.running) this.editor.open = false;
        this.save.disabled = !this.client.connected;
        const key = JSON.stringify([room.id, room.name, settings]);
        if (key !== this.settingsKey) {
            this.settingsKey = key;
            this.name.value = room.name;
            this.duration.value = String(settings.durationSeconds);
            this.goals.value = String(settings.goalLimit);
        }
    }
}
