import type { RoomState } from '../../shared/game/lobbyProtocol';
import { LobbyClient } from './client';
import { node, button } from './dom';

export class RoomView {
    readonly element = node('main', 'room-screen');
    readonly gameHost = node('div', 'game-host');
    private title = node('h1');
    private phase = node('p', 'muted');
    private notice = node('p', 'notice');
    private roster = node('div', 'roster');
    private chat = node('div', 'chat-history');
    private text = node('input');
    private team = node('select');
    private start: HTMLButtonElement;
    private stop: HTMLButtonElement;
    private link = node('input');
    private lastMessage = 0;
    constructor(private readonly client: LobbyClient) {
        const header = node('header', 'room-heading');
        const title = node('div');
        title.append(this.title, this.phase);
        this.start = button('Rozpocznij mecz', () => client.send({ type: 'start' }));
        this.start.classList.add('primary');
        this.stop = button('Zatrzymaj', () => client.send({ type: 'stop' }));
        const controls = node('div', 'room-controls');
        controls.append(
            this.start,
            this.stop,
            button('Wyjdź do lobby', () => client.send({ type: 'leave' })),
        );
        header.append(title, controls);
        const aside = node('aside', 'room-sidebar');
        const teamLabel = node('label', 'field', 'Twoja drużyna');
        for (const [value, name] of [
            ['blue', 'Niebiescy'],
            ['orange', 'Pomarańczowi'],
            ['spectator', 'Obserwator'],
        ]) {
            const option = node('option', '', name);
            option.value = value;
            this.team.append(option);
        }
        this.team.setAttribute('aria-label', 'Twoja drużyna');
        this.team.onchange = () =>
            client.send({ type: 'team', team: this.team.value as 'blue' | 'orange' | 'spectator' });
        teamLabel.append(this.team);
        this.link.readOnly = true;
        this.link.setAttribute('aria-label', 'Link do pokoju');
        this.link.onclick = () => this.link.select();
        const share = node('label', 'field', 'Zaproś znajomych');
        share.append(this.link);
        this.chat.setAttribute('role', 'log');
        this.chat.setAttribute('aria-label', 'Chat pokoju');
        const form = node('form', 'chat-form');
        this.text.placeholder = 'Napisz wiadomość…';
        this.text.maxLength = 320;
        this.text.setAttribute('aria-label', 'Wiadomość');
        const send = node('button', 'button', 'Wyślij');
        form.append(this.text, send);
        form.onsubmit = (event) => {
            event.preventDefault();
            if (!this.text.value.trim()) return;
            client.send({ type: 'chat', text: this.text.value });
            this.text.value = '';
        };
        aside.append(teamLabel, this.roster, share, node('h2', '', 'Chat'), this.chat, form);
        const body = node('section', 'room-body');
        body.append(this.gameHost, aside);
        this.element.append(header, this.notice, body);
    }
    render(room: RoomState) {
        this.title.textContent = room.name;
        this.phase.textContent = `${room.running ? 'Mecz trwa' : 'Przed meczem'} · ${room.members.filter((m) => m.seat !== null).length}/10 graczy`;
        const host = room.hostId === this.client.id;
        this.start.disabled = !host || room.running || !room.ready;
        this.stop.disabled = !host || !room.running;
        this.notice.textContent =
            this.client.error ||
            (room.running
                ? host
                    ? 'Jesteś gospodarzem. Mecz trwa — możesz go zatrzymać.'
                    : 'Mecz trwa. Możesz grać, obserwować i pisać na chacie.'
                : host
                  ? 'Jesteś gospodarzem. Wybierz składy i rozpocznij mecz.'
                  : 'Czekamy na rozpoczęcie meczu przez gospodarza.');
        this.notice.classList.toggle('error', !!this.client.error);
        const self = room.members.find((m) => m.id === this.client.id);
        this.team.value =
            self?.seat === null || !self ? 'spectator' : self.seat % 2 === 0 ? 'blue' : 'orange';
        this.link.value = `${location.origin}/?room=${encodeURIComponent(room.id)}`;
        this.roster.replaceChildren();
        for (const [team, name] of [
            [0, 'Niebiescy'],
            [1, 'Pomarańczowi'],
            [2, 'Obserwatorzy'],
        ] as const) {
            const group = node('section', `team team-${team}`);
            group.append(node('h3', '', name));
            const players = room.members.filter((m) =>
                team === 2 ? m.seat === null : m.seat !== null && m.seat % 2 === team,
            );
            if (!players.length) group.append(node('p', 'muted', '—'));
            for (const m of players)
                group.append(
                    node(
                        'p',
                        m.id === this.client.id ? 'self' : '',
                        `${m.seat === null ? '•' : String.fromCharCode(65 + m.seat)}  ${m.nick}${m.id === room.hostId ? ' · gospodarz' : ''}`,
                    ),
                );
            this.roster.append(group);
        }
        const atBottom = this.chat.scrollHeight - this.chat.scrollTop - this.chat.clientHeight < 40;
        this.chat.replaceChildren();
        for (const entry of room.messages) {
            const item = node('p', entry.kind === 'system' ? 'system-message' : 'chat-message');
            if (entry.nick) item.append(node('strong', '', `${entry.nick}: `));
            item.append(document.createTextNode(entry.text));
            this.chat.append(item);
        }
        const last = room.messages.at(-1)?.id ?? 0;
        if (last !== this.lastMessage && atBottom) this.chat.scrollTop = this.chat.scrollHeight;
        this.lastMessage = last;
    }
}
