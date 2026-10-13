import { LobbyClient } from './client';
import { node, button } from './dom';

export class LobbyView {
    readonly element = node('main', 'lobby-screen');
    private readonly list = node('div', 'room-list');
    private readonly status = node('p', 'notice');
    private readonly nick = node('input');
    private readonly roomName = node('input');
    private readonly create = node('button', 'button primary', 'Utwórz pokój');
    constructor(private readonly client: LobbyClient) {
        const header = node('header', 'lobby-heading');
        header.append(
            node('span', 'eyebrow', 'THROW / ONLINE'),
            node('h1', '', 'Wybierz swoje boisko'),
            node('p', 'muted', 'Dołącz do meczu albo zaproś znajomych do własnego pokoju.'),
        );
        const profile = node('label', 'field', 'Twój nick');
        this.nick.value = client.nick;
        this.nick.placeholder = 'Jak się nazywasz?';
        this.nick.maxLength = 20;
        this.nick.minLength = 2;
        this.nick.setAttribute('aria-label', 'Twój nick');
        profile.append(this.nick);
        const form = node('form', 'create-room');
        const name = node('label', 'field', 'Nazwa pokoju');
        this.roomName.placeholder = 'Wieczorny mecz';
        this.roomName.maxLength = 40;
        this.roomName.required = true;
        this.roomName.setAttribute('aria-label', 'Nazwa pokoju');
        name.append(this.roomName);
        form.append(name, this.create);
        form.onsubmit = (event) => {
            event.preventDefault();
            if (!this.identify()) return;
            client.send({ type: 'create', name: this.roomName.value });
        };
        const panels = node('section', 'lobby-panels');
        const setup = node('div', 'panel setup');
        setup.append(node('h2', '', 'Przygotuj się do gry'), profile, form);
        const rooms = node('div', 'panel');
        rooms.append(node('h2', '', 'Otwarte pokoje'), this.list);
        panels.append(setup, rooms);
        this.element.append(header, this.status, panels);
        const training = node('a', 'training-link', 'Trening lokalny');
        training.href = '?local=1';
        this.element.append(training);
    }
    private identify() {
        if (this.nick.value.trim().length < 2) {
            this.client.error = 'Wpisz nick — minimum 2 znaki.';
            this.render();
            this.nick.focus();
            return false;
        }
        this.client.setNick(this.nick.value);
        return true;
    }
    render() {
        this.status.textContent =
            this.client.error ||
            (this.client.connected
                ? 'Połączono. Maksymalnie 10 graczy w każdym pokoju.'
                : 'Łączenie z serwerem…');
        this.status.classList.toggle('error', !!this.client.error);
        this.create.disabled = !this.client.connected;
        this.list.replaceChildren();
        if (!this.client.rooms.length) {
            this.list.append(
                node('p', 'empty', 'Jeszcze nie ma pokoi. Utwórz pierwszy i podziel się linkiem.'),
            );
            return;
        }
        for (const room of this.client.rooms) {
            const row = node('div', 'room-card');
            const info = node('div');
            info.append(
                node('h3', '', room.name),
                node(
                    'p',
                    'muted',
                    `${room.players}/10 graczy · ${room.running ? 'Mecz trwa' : 'Przed meczem'}`,
                ),
            );
            const join = button('Dołącz', () => {
                if (this.identify()) this.client.send({ type: 'join', roomId: room.id });
            });
            join.disabled = !this.client.connected;
            row.append(info, join);
            this.list.append(row);
        }
    }
}
