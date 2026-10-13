import type { MatchSettings, MatchProgress } from './matchRules';
export type TeamChoice = 'blue' | 'orange' | 'spectator';
export interface RoomMember {
    id: string;
    nick: string;
    connected: boolean;
    seat: number | null;
}
export interface ChatEntry {
    id: number;
    kind: 'chat' | 'system';
    text: string;
    nick?: string;
    time: number;
}
export interface RoomInfo {
    id: string;
    name: string;
    hostId: string;
    running: boolean;
    players: number;
    members: number;
}
export interface RoomState extends Omit<RoomInfo, 'players' | 'members'> {
    ready: boolean;
    match: MatchProgress;
    members: RoomMember[];
    messages: ChatEntry[];
}
export type LobbyRequest =
    | { type: 'hello'; nick: string }
    | { type: 'create'; name: string }
    | { type: 'join'; roomId: string }
    | { type: 'leave' }
    | { type: 'team'; team: TeamChoice }
    | { type: 'chat'; text: string }
    | { type: 'settings'; name: string; settings: MatchSettings }
    | { type: 'start' }
    | { type: 'stop' };
export type LobbyMessage =
    | { type: 'identity'; id: string; resumeToken: string }
    | { type: 'rooms'; rooms: RoomInfo[] }
    | { type: 'room'; room: RoomState | null }
    | { type: 'error'; message: string };
