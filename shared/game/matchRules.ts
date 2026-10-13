export interface MatchSettings {
    durationSeconds: number;
    goalLimit: number;
}
export interface MatchProgress {
    settings: MatchSettings;
    phase: 'waiting' | 'running' | 'finished';
    remainingSeconds: number | null;
    result: {
        score: [number, number];
        winner: 'blue' | 'orange' | 'draw';
        reason: 'time' | 'goals';
    } | null;
}
export const DEFAULT_MATCH_SETTINGS: MatchSettings = { durationSeconds: 300, goalLimit: 5 };
export function validMatchSettings(value: unknown): value is MatchSettings {
    if (!value || typeof value !== 'object') return false;
    const { durationSeconds: time, goalLimit: goals } = value as MatchSettings;
    return (
        Number.isInteger(time) &&
        (time === 0 || (time >= 10 && time <= 3600)) &&
        Number.isInteger(goals) &&
        goals >= 0 &&
        goals <= 50 &&
        (time > 0 || goals > 0)
    );
}
export class MatchFlow {
    private settings = { ...DEFAULT_MATCH_SETTINGS };
    private phase: MatchProgress['phase'] = 'waiting';
    private elapsed = 0;
    private ending?: { remaining: number; score: [number, number]; reason: 'time' | 'goals' };
    private result: MatchProgress['result'] = null;
    configure(settings: MatchSettings) {
        if (this.phase === 'running' || !validMatchSettings(settings)) return false;
        this.settings = { ...settings };
        return true;
    }
    start() {
        this.phase = 'running';
        this.elapsed = 0;
        this.ending = undefined;
        this.result = null;
    }
    stop() {
        this.phase = 'waiting';
        this.elapsed = 0;
        this.ending = undefined;
        this.result = null;
    }
    step(seconds: number, score: [number, number], goal: boolean) {
        if (this.phase !== 'running') return false;
        if (this.ending) {
            this.ending.remaining -= seconds;
            if (this.ending.remaining <= 0)
                return this.finish(this.ending.score, this.ending.reason);
            return false;
        }
        this.elapsed += seconds;
        const goalsReached =
            this.settings.goalLimit > 0 && Math.max(...score) >= this.settings.goalLimit;
        const timeReached =
            this.settings.durationSeconds > 0 && this.elapsed >= this.settings.durationSeconds;
        if (!goalsReached && !timeReached) return false;
        const reason = goalsReached ? 'goals' : 'time';
        // Keep the familiar post-goal free-play window before showing the result.
        if (goal) {
            this.ending = { remaining: 1.3, score: [...score], reason };
            return false;
        }
        return this.finish(score, reason);
    }
    private finish(score: [number, number], reason: 'time' | 'goals') {
        this.phase = 'finished';
        this.result = {
            score: [...score],
            winner: score[0] === score[1] ? 'draw' : score[0] > score[1] ? 'blue' : 'orange',
            reason,
        };
        return true;
    }
    get canKickoff() {
        return !this.ending;
    }
    snapshot(): MatchProgress {
        return {
            settings: { ...this.settings },
            phase: this.phase,
            remainingSeconds: this.settings.durationSeconds
                ? Math.max(0, Math.ceil(this.settings.durationSeconds - this.elapsed))
                : null,
            result: this.result ? { ...this.result, score: [...this.result.score] } : null,
        };
    }
}
