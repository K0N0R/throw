import { resolveAvatar } from '../../shared/game/avatars';
import type { RoomState, TeamChoice } from '../../shared/game/lobbyProtocol';
import { LobbyClient } from './client';
import { node, button } from './dom';

export class RoomManagement {
    readonly element = node('details', 'room-management');
    private target = node('select');
    private team = node('select');
    private password = node('input');
    private accessState = node('p', 'muted');
    private move: HTMLButtonElement;
    private transfer: HTMLButtonElement;
    private kick: HTMLButtonElement;
    private save: HTMLButtonElement;
    private key = '';
    private room?: RoomState;
    constructor(private client: LobbyClient) {
        this.element.append(node('summary', '', 'Zarządzanie pokojem'));
        const players = node('div', 'management-players');
        const personLabel = node('label', 'field', 'Osoba w pokoju');
        this.target.setAttribute('aria-label', 'Osoba w pokoju');
        this.target.onchange = () => this.render(this.room!);
        personLabel.append(this.target);
        const teamLabel = node('label', 'field', 'Przenieś do');
        this.team.setAttribute('aria-label', 'Przenieś do');
        for (const [value, text] of [
            ['blue', 'Niebiescy'],
            ['orange', 'Pomarańczowi'],
            ['spectator', 'Obserwatorzy'],
        ]) {
            const option = node('option', '', text);
            option.value = value;
            this.team.append(option);
        }
        teamLabel.append(this.team);
        this.move = button('Przenieś', () =>
            client.send({
                type: 'move',
                memberId: this.target.value,
                team: this.team.value as TeamChoice,
            }),
        );
        this.transfer = button('Przekaż gospodarza', () =>
            client.send({ type: 'transfer', memberId: this.target.value }),
        );
        this.kick = button('Wyrzuć z pokoju', () =>
            client.send({ type: 'kick', memberId: this.target.value }),
        );
        this.kick.classList.add('danger');
        const actions = node('div', 'management-actions');
        actions.append(this.move, this.transfer, this.kick);
        players.append(personLabel, teamLabel, actions);
        const access = node('form', 'room-access');
        const passwordLabel = node('label', 'field', 'Nowe hasło pokoju');
        this.password.type = 'password';
        this.password.maxLength = 64;
        this.password.autocomplete = 'new-password';
        this.password.setAttribute('aria-label', 'Nowe hasło pokoju');
        this.password.placeholder = 'Puste pole usuwa hasło';
        passwordLabel.append(this.password);
        this.save = node('button', 'button', 'Zapisz hasło');
        this.save.type = 'submit';
        access.onsubmit = (event) => {
            event.preventDefault();
            client.send({ type: 'access', password: this.password.value });
            this.password.value = '';
        };
        access.append(this.accessState, passwordLabel, this.save);
        this.element.append(players, access);
    }
    render(room: RoomState) {
        if (this.room?.id !== room.id) this.password.value = '';
        this.room = room;
        const host = room.hostId === this.client.id;
        this.element.hidden = !host;
        if (!host) {
            this.element.open = false;
            this.password.value = '';
        }
        const key = JSON.stringify([
            room.id,
            room.members.map((m) => [m.id, m.nick, m.seat, m.avatar]),
        ]);
        if (key !== this.key) {
            this.key = key;
            const selected = this.target.value;
            this.target.replaceChildren();
            for (const member of room.members) {
                const option = node(
                    'option',
                    '',
                    `${resolveAvatar(member.avatar)} ${member.nick}${member.seat === null ? ' · widz' : ''}`,
                );
                option.value = member.id;
                this.target.append(option);
            }
            if (room.members.some((m) => m.id === selected)) this.target.value = selected;
            else
                this.target.value =
                    room.members.find((m) => m.id !== this.client.id)?.id ?? this.client.id;
        }
        const selected = room.members.find((m) => m.id === this.target.value);
        this.move.disabled = !this.client.connected || !selected;
        this.transfer.disabled =
            !this.client.connected || !selected?.connected || selected.id === this.client.id;
        this.kick.disabled = !this.client.connected || !selected || selected.id === this.client.id;
        this.save.disabled = !this.client.connected;
        this.target.disabled = this.team.disabled = this.password.disabled = !this.client.connected;
        this.accessState.textContent = room.locked
            ? 'Pokój z hasłem. Nowe osoby muszą je podać przy dołączaniu.'
            : 'Pokój otwarty — bez hasła.';
    }
}
