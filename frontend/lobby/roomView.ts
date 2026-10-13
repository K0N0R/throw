import { ArenaPanel } from './arenaPanel';
import { resolveAvatar } from '../../shared/game/avatars';
import type { RoomState } from '../../shared/game/lobbyProtocol';
import { LobbyClient } from './client';
import { RoomManagement } from './roomManagement';
import { MatchPanel } from './matchPanel';
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
    private matchPanel: MatchPanel;
    private management: RoomManagement;
    private arenaPanel: ArenaPanel;
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
        this.matchPanel = new MatchPanel(client);
        this.management = new RoomManagement(client);
        this.arenaPanel = new ArenaPanel(client);
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
            if (!client.connected || !this.text.value.trim()) return;
            client.send({ type: 'chat', text: this.text.value });
            this.text.value = '';
        };
        const details = node('div', 'room-details');
        details.append(
            header,
            this.notice,
            this.matchPanel.element,
            this.arenaPanel.element,
            this.management.element,
            teamLabel,
            this.roster,
            share,
        );
        aside.append(details, node('h2', '', 'Chat'), this.chat, form);
        const body = node('section', 'room-body');
        body.append(this.gameHost, aside);
        this.element.append(body);
    }
    render(room: RoomState) {
        this.title.textContent = room.name;
        this.matchPanel.render(room);
        this.management.render(room);
        this.arenaPanel.render(room);
        this.start.textContent =
            room.match.phase === 'finished' ? 'Zagraj rewanż' : 'Rozpocznij mecz';
        const host = room.hostId === this.client.id;
        this.phase.textContent = `${room.running ? 'Mecz trwa' : room.match.phase === 'finished' ? 'Mecz zakończony' : 'Przed meczem'} · ${room.members.filter((m) => m.seat !== null).length}/10 graczy (${host ? 'gospodarz' : 'uczestnik'})`;
        this.start.disabled = !this.client.connected || !host || room.running || !room.ready;
        this.stop.disabled = !this.client.connected || !host || !room.running;
        this.team.disabled = !this.client.connected;
        this.text.disabled = !this.client.connected;
        this.notice.textContent = this.client.error;
        this.notice.hidden = !this.client.error;
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
                        `${resolveAvatar(m.avatar)} ${m.nick}${m.id === room.hostId ? ' · gospodarz' : ''}${m.connected ? '' : ' · łączy się…'}`,
                    ),
                );
            this.roster.append(group);
        }
        const atBottom = this.chat.scrollHeight - this.chat.scrollTop - this.chat.clientHeight < 40;
        this.chat.replaceChildren();
        for (const entry of room.messages) {
            const item = node('p', entry.kind === 'system' ? 'system-message' : 'chat-message');
            if (entry.nick)
                item.append(node('strong', '', `${resolveAvatar(entry.avatar)} ${entry.nick}: `));
            item.append(document.createTextNode(entry.text));
            this.chat.append(item);
        }
        const last = room.messages.at(-1)?.id ?? 0;
        if (last !== this.lastMessage && atBottom) this.chat.scrollTop = this.chat.scrollHeight;
        this.lastMessage = last;
    }
}
