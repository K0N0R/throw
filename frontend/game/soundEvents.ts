import type { GameSnapshot } from '../../shared/game/simulation';
import type { RoomState } from '../../shared/game/lobbyProtocol';

export class GameSoundEvents {
    private previous?: GameSnapshot;
    private kickSerial = 0;
    private lastImpact = -Infinity;
    private bounce = 0;
    private playing = false;

    update(state: GameSnapshot, seat: number | null, playing: boolean, now: number): string[] {
        const before = this.previous;
        const wasPlaying = this.playing;
        this.previous = state;
        this.playing = playing;
        if (!before || !playing || !wasPlaying) {
            this.kickSerial = state.kickSerial;
            return [];
        }
        const sounds: string[] = [];
        if (state.score.some((score, index) => score > before.score[index]))
            sounds.push('goal-celebration');
        if (state.epoch !== before.epoch) {
            this.kickSerial = state.kickSerial;
            this.lastImpact = now;
            return [...sounds, 'start'];
        }
        const velocity = state.ballState.velocity;
        const kicked = state.kickSerial > this.kickSerial;
        this.kickSerial = Math.max(this.kickSerial, state.kickSerial);
        if (kicked) {
            sounds.push(
                Math.hypot(velocity.x, velocity.y) >= 14 ? 'soccer-strong-kick' : 'soccer-kick',
            );
            this.lastImpact = now;
        } else {
            const previousVelocity = before.ballState.velocity;
            const change = Math.hypot(
                velocity.x - previousVelocity.x,
                velocity.y - previousVelocity.y,
            );
            const distance = Math.hypot(state.ball.x - before.ball.x, state.ball.y - before.ball.y);
            const expectedTravel =
                Math.max(
                    Math.hypot(velocity.x, velocity.y),
                    Math.hypot(previousVelocity.x, previousVelocity.y),
                ) / 60;
            if (change > 2 && distance < expectedTravel + 0.15 && now - this.lastImpact >= 100) {
                sounds.push(`ball-bounce-${(this.bounce++ % 10) + 1}`);
                this.lastImpact = now;
            }
        }
        if (seat !== null && state.energy[seat] > (before.energy[seat] ?? 0))
            sounds.push('booster');
        return sounds;
    }
}

export class RoomSoundEvents {
    private previous: RoomState | null = null;

    update(room: RoomState | null, nick: string): string[] {
        const before = this.previous;
        this.previous = room;
        if (!room) return before ? ['ui-close'] : [];
        if (!before || before.id !== room.id) return ['ui-open'];
        const sounds: string[] = [];
        if (room.match.phase !== before.match.phase) {
            if (room.match.phase === 'running') sounds.push('start');
            if (room.match.phase === 'finished') sounds.push('end');
            if (room.match.phase === 'waiting') sounds.push('ui-hide');
        }
        if (room.members.some((member) => !before.members.some((old) => old.id === member.id)))
            sounds.push('ui-confirm');
        if (
            before.members.some(
                (member) => !room.members.some((current) => current.id === member.id),
            )
        )
            sounds.push('ui-hide');
        const lastMessage = before.messages.at(-1)?.id ?? 0;
        if (
            room.messages.some(
                (entry) => entry.id > lastMessage && entry.kind === 'chat' && entry.nick !== nick,
            )
        )
            sounds.push('message-notification-1');
        const seconds = room.match.remainingSeconds;
        if (
            room.running &&
            seconds !== null &&
            seconds > 0 &&
            seconds <= 5 &&
            seconds !== before.match.remainingSeconds
        )
            sounds.push('ping');
        return sounds;
    }
}
