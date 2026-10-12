import type { GameSnapshot, Input } from './simulation';
export const NEUTRAL: Input = { x: 0, y: 0, shoot: false };
export interface Command extends Input {
    seq: number;
}
export interface ServerState {
    type: 'state';
    tick: number;
    time: number;
    ready: boolean;
    ack: number[];
    inputs: Input[];
    game: GameSnapshot;
}
export type ServerMessage =
    | ServerState
    | { type: 'welcome'; seat: number | null }
    | { type: 'pong'; sent: number };
export type ClientMessage =
    | { type: 'input'; epoch: number; commands: Command[] }
    | { type: 'release' }
    | { type: 'reset'; match: boolean }
    | { type: 'ping'; sent: number };

export function validCommand(value: unknown): value is Command {
    if (!value || typeof value !== 'object') return false;
    const v = value as Command;
    return (
        Number.isSafeInteger(v.seq) &&
        v.seq > 0 &&
        Number.isFinite(v.x) &&
        Number.isFinite(v.y) &&
        Math.abs(v.x) <= 1 &&
        Math.abs(v.y) <= 1 &&
        typeof v.shoot === 'boolean'
    );
}
