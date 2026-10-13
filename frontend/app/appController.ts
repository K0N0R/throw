import { Core } from '../core/core';
import { GameSettings } from '../core/systems/gameSettings';
import { GameState } from '../core/systems/gameState';
import { prepreload } from '../core/prepreload';
import { preload } from '../core/preload';
import { Simulation, RULES } from '../../shared/game/simulation';
import { GameView } from '../game/gameView';
import { LocalSession, OnlineSession } from '../game/session';
import { LobbyClient } from '../lobby/client';
import { LobbyView } from '../lobby/lobbyView';
import { RoomView } from '../lobby/roomView';

export class AppController {
    private readonly root = document.createElement('div');
    private core?: Core;
    private corePromise?: Promise<void>;
    private game?: GameView;
    private client?: LobbyClient;
    private roomId?: string;
    private memberSeat: number | null | undefined;
    private generation = 0;
    private joining?: string;

    async init() {
        this.root.id = 'throw-app';
        document.body.append(this.root);
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) location.reload();
        });
        GameSettings.init();
        await prepreload();
        const params = new URLSearchParams(location.search);
        if (params.has('local') || params.has('quick')) {
            const host = document.createElement('div');
            host.className = 'standalone-game';
            this.root.append(host);
            await this.initCore(host);
            await this.createGame(params.has('local'));
            GameState.goToGameplay();
            return;
        }
        const client = (this.client = new LobbyClient());
        const lobby = new LobbyView(client),
            room = new RoomView(client);
        this.root.append(lobby.element, room.element);
        room.element.hidden = true;
        client.onChange = () => {
            if (!client.room) {
                room.element.hidden = true;
                lobby.element.hidden = false;
                lobby.render();
                if (GameState.state !== 'lobby') GameState.goToLobby();
                if (this.roomId) {
                    this.generation++;
                    this.game?.dispose();
                    this.game = undefined;
                    this.roomId = undefined;
                    this.memberSeat = undefined;
                    this.core?.app.stop();
                    const url = new URL(location.href);
                    url.searchParams.delete('room');
                    history.replaceState(null, '', url);
                    params.delete('room');
                }
                const target = params.get('room');
                if (
                    target &&
                    client.id &&
                    client.connected &&
                    client.nick.length >= 2 &&
                    client.rooms.some((r) => r.id === target) &&
                    this.joining !== target
                ) {
                    this.joining = target;
                    client.send({ type: 'join', roomId: target });
                }
                return;
            }
            const state = client.room;
            lobby.element.hidden = true;
            room.element.hidden = false;
            room.render(state);
            const memberSeat = state.members.find((m) => m.id === client.id)?.seat;
            if (this.roomId !== state.id || this.memberSeat !== memberSeat) {
                this.roomId = state.id;
                this.memberSeat = memberSeat;
                this.game?.dispose();
                this.game = undefined;
                const generation = ++this.generation;
                this.initCore(room.gameHost)
                    .then(async () => {
                        if (generation !== this.generation) return;
                        await this.createGame(
                            false,
                            { roomId: state.id, memberId: client.id },
                            generation,
                        );
                    })
                    .catch((error) => {
                        client.error = String(error);
                        room.render(state);
                    });
            }
            if (state.running && GameState.state !== 'gameplay') GameState.goToGameplay();
            else if (!state.running && GameState.state !== 'lobby') GameState.goToLobby();
            const url = new URL(location.href);
            url.searchParams.set('room', state.id);
            history.replaceState(null, '', url);
        };
        lobby.render();
        window.addEventListener('pagehide', () => {
            this.generation++;
            this.game?.dispose();
            client.dispose();
        });
    }
    private async initCore(host: HTMLElement) {
        if (!this.corePromise)
            this.corePromise = (async () => {
                const core = (this.core = new Core());
                await core.init({ host, minimal: true });
                globalThis.__PIXI_APP__ = core.app;
                await preload();
            })();
        await this.corePromise;
        this.core!.app.resize();
    }
    private async createGame(
        local: boolean,
        membership?: { roomId: string; memberId: string },
        generation = this.generation,
    ) {
        const simulation = await Simulation.create(local ? false : RULES.maxPlayers);
        if (generation !== this.generation) {
            simulation.dispose();
            return;
        }
        if (!local) simulation.setConnectedSeats([]);
        const session = local
            ? new LocalSession(simulation)
            : new OnlineSession(
                  simulation,
                  Number(new URLSearchParams(location.search).get('latency')) || 0,
                  membership,
              );
        this.core!.app.start();
        this.game = new GameView(this.core!.app, session);
    }
}
