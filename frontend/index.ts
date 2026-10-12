import { Application } from 'pixi.js';
import { Simulation } from '../shared/game/simulation';
import { LocalSession, OnlineSession } from './game/session';
import { GameView } from './game/gameView';

async function init() {
    const params = new URLSearchParams(location.search);
    const local = params.has('local');
    const simulation = await Simulation.create(local ? false : 4);
    if (!local) simulation.setConnectedSeats([]);
    const app = new Application();
    await app.init({
        resizeTo: window,
        backgroundColor: 0x081b26,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
    });
    document.body.appendChild(app.canvas);
    const session = local
        ? new LocalSession(simulation)
        : new OnlineSession(simulation, Number(params.get('latency')) || 0);
    new GameView(app, session);
    globalThis.__PIXI_APP__ = app;
}
init().catch((error: unknown) => {
    console.error(error);
    const message = document.createElement('p');
    message.textContent =
        'Nie udało się uruchomić gry. Odśwież stronę i sprawdź konsolę przeglądarki.';
    message.style.cssText = 'color: white; padding: 32px; font-family: sans-serif';
    document.body.appendChild(message);
});
