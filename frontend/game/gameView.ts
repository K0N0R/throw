import { Application, Container, Graphics, Text } from 'pixi.js';
import { RULES, type GameSnapshot, type Position } from '../../shared/game/simulation';

import type { GameSession } from './session';

const SCALE = 50;
const OFFSET = { x: 200, y: 205 };
const COLORS = { blue: 0x6bbcff, orange: 0xffaa69, ink: 0xe6eef4, muted: 0x8cabbc };

export class GameView {
    private readonly scene = new Container();
    private readonly ball = new Graphics();
    private subtitle!: Text;
    private resetLabel!: Text;
    private readonly avatars = new Map<
        number,
        { container: Container; body: Graphics; shooting?: boolean }
    >();
    private diagnostics!: Text;
    private readonly aim = new Graphics();
    private readonly keys = new Set<string>();
    private readonly scoreboard = this.text('', 42, COLORS.ink);
    private readonly status = this.text('', 18, COLORS.muted);
    private readonly announcement = this.text('', 40, COLORS.ink);
    private previous!: GameSnapshot;
    private current!: GameSnapshot;
    private accumulator = 0;
    private readonly listeners = new AbortController();
    private disposed = false;
    private static readonly controls = new Set([
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
        'KeyX',
        'Space',
        'KeyR',
    ]);

    constructor(
        private readonly app: Application,
        private readonly session: GameSession,
    ) {
        this.current = this.previous = session.snapshot();
        this.buildScene();
        this.app.stage.addChild(this.scene);
        this.bindInput();
        this.app.renderer.on('resize', this.resize);
        this.resize();
        this.app.ticker.add(this.update);
        this.render(0);
    }

    private text(value: string, size: number, color: number) {
        return new Text({
            text: value,
            style: { fontFamily: 'Arial, sans-serif', fontSize: size, fill: color },
        });
    }
    private label(value: string, x: number, y: number, size = 16, color = COLORS.muted) {
        const label = this.text(value, size, color);
        label.position.set(x, y);
        this.scene.addChild(label);
        return label;
    }

    private drawPlayer(graphics: Graphics, color: number, shooting = false) {
        graphics
            .clear()
            .circle(2, 5, RULES.playerRadius * SCALE)
            .fill({ color: 0x000000, alpha: 0.22 });
        graphics
            .circle(0, 0, RULES.playerRadius * SCALE)
            .fill(color)
            .stroke({ color: shooting ? 0xffffff : 0x000000, width: 3 });
        graphics.circle(-7, -7, 6).fill({ color: 0xffffff, alpha: 0.4 });
    }
    private buildScene() {
        const field = new Graphics();
        field.roundRect(100, 175, 1400, 660, 24).fill(0x102c36);
        field.rect(200, 205, 1200, 600).fill(0x183d43);
        for (let i = 0; i < 12; i += 2)
            field.rect(200 + i * 100, 205, 100, 600).fill({ color: 0x234d50, alpha: 0.42 });
        field.rect(200, 205, 1200, 600).stroke({ color: 0x8cbbb8, width: 2, alpha: 0.7 });
        field.moveTo(800, 205).lineTo(800, 805).stroke({ color: 0x8cbbb8, width: 2, alpha: 0.4 });
        field.circle(800, 505, 95).stroke({ color: 0x8cbbb8, width: 2, alpha: 0.4 });
        field.circle(800, 505, 4).fill(0x8cbbb8);
        const gh = RULES.goalHeight * SCALE,
            gy = OFFSET.y + (RULES.height * SCALE - gh) / 2;
        for (const [x, color] of [
            [130, COLORS.blue],
            [1400, COLORS.orange],
        ] as const) {
            field.rect(x, gy, 70, gh).fill({ color, alpha: 0.12 }).stroke({ color, width: 3 });
            for (let j = 1; j < 5; j++)
                field
                    .moveTo(x + j * 14, gy)
                    .lineTo(x + j * 14, gy + gh)
                    .stroke({ color, alpha: 0.2, width: 1 });
            for (let j = 1; j < 9; j++)
                field
                    .moveTo(x, gy + (j * gh) / 9)
                    .lineTo(x + 70, gy + (j * gh) / 9)
                    .stroke({ color, alpha: 0.2, width: 1 });
        }
        this.scene.addChild(field);
        this.label('THROW', 100, 50, 38, COLORS.ink);
        this.subtitle = this.label(this.session.label, 103, 98, 14);
        this.diagnostics = this.label('', 110, 885, 12);
        this.label('NIEBIESCY', 560, 65, 16, COLORS.blue);
        this.label('POMARAŃCZOWI', 905, 65, 16, COLORS.orange);
        this.scoreboard.anchor.set(0.5);
        this.scoreboard.position.set(800, 85);
        this.scene.addChild(this.scoreboard);
        this.status.anchor.set(0.5);
        this.status.position.set(800, 140);
        this.scene.addChild(this.status);
        this.label(
            'WASD / STRZAŁKI   ruch     ·     X / SPACJA   strzał     ·     R   reset akcji',
            110,
            857,
            18,
        );
        const reset = new Container();
        reset.addChild(new Graphics().roundRect(0, 0, 160, 44, 12).fill(0x24424f));
        const resetLabel = (this.resetLabel = this.text(
            this.session.seat === 1 ? 'Reset: niebiescy' : 'Reset wyniku',
            17,
            COLORS.ink,
        ));
        resetLabel.anchor.set(0.5);
        resetLabel.position.set(80, 22);
        reset.addChild(resetLabel);
        reset.position.set(1340, 52);
        reset.eventMode = 'static';
        reset.cursor = 'pointer';
        reset.on('pointertap', () => this.reset(true));
        this.scene.addChild(reset);
        this.announcement.anchor.set(0.5);
        this.announcement.position.set(800, 350);
        this.ball.circle(2, 4, RULES.ballRadius * SCALE).fill({ color: 0x000000, alpha: 0.3 });
        this.ball
            .circle(0, 0, RULES.ballRadius * SCALE)
            .fill(0xfff5df)
            .stroke({ color: 0x162a35, width: 2 });
        this.ball.circle(0, 0, 5).fill(0x425963);
        this.scene.addChild(this.aim, this.ball, this.announcement);
    }

    private bindInput() {
        const options = { signal: this.listeners.signal };
        window.addEventListener(
            'keydown',
            (event) => {
                if (
                    event.target instanceof HTMLElement &&
                    event.target.closest('input, textarea, select, [contenteditable]')
                )
                    return;
                if (!GameView.controls.has(event.code)) return;
                event.preventDefault();
                this.keys.add(event.code);
                if (event.code === 'KeyR' && !event.repeat) this.reset(false);
            },
            options,
        );
        window.addEventListener(
            'keyup',
            (event) => {
                if (
                    GameView.controls.has(event.code) &&
                    !(
                        event.target instanceof HTMLElement &&
                        event.target.closest('input, textarea, select, [contenteditable]')
                    )
                )
                    event.preventDefault();
                this.keys.delete(event.code);
            },
            options,
        );
        window.addEventListener(
            'focusin',
            (event) => {
                if (
                    event.target instanceof HTMLElement &&
                    event.target.closest('input, textarea, select, [contenteditable]')
                )
                    this.clearInput();
            },
            options,
        );
        window.addEventListener('blur', () => this.clearInput(), options);
        document.addEventListener('visibilitychange', () => this.clearInput(), options);
        window.addEventListener('pagehide', () => this.dispose(), options);
    }
    private clearInput() {
        this.keys.clear();
        this.session.release();
        this.accumulator = 0;
        this.previous = this.current;
    }
    private reset(match: boolean) {
        this.session.reset(match);
        this.current = this.previous = this.session.snapshot();
        this.accumulator = 0;
        this.render(0);
    }
    private resize = () => {
        const scale = Math.min(this.app.screen.width / 1600, this.app.screen.height / 900);
        this.scene.scale.set(scale);
        this.scene.position.set(
            (this.app.screen.width - 1600 * scale) / 2,
            (this.app.screen.height - 900 * scale) / 2,
        );
    };
    private update = () => {
        if (document.hidden || this.disposed) return;
        this.accumulator += Math.min(this.app.ticker.deltaMS / 1000, 0.1);
        const pressed = (...codes: string[]) => (codes.some((code) => this.keys.has(code)) ? 1 : 0);
        const input = {
            x: pressed('ArrowRight', 'KeyD') - pressed('ArrowLeft', 'KeyA'),
            y: pressed('ArrowDown', 'KeyS') - pressed('ArrowUp', 'KeyW'),
            shoot: Boolean(pressed('KeyX', 'Space')),
        };
        while (this.accumulator >= RULES.timestep) {
            this.previous = this.current;
            this.session.step(input);
            this.current = this.session.snapshot();
            if (this.previous.epoch !== this.current.epoch) this.previous = this.current;
            this.accumulator -= RULES.timestep;
        }
        this.render(this.accumulator / RULES.timestep);
    };
    private render(alpha: number) {
        const position = (object: Container, before: Position, after: Position) =>
            object.position.set(
                OFFSET.x + (before.x + (after.x - before.x) * alpha) * SCALE,
                OFFSET.y + (before.y + (after.y - before.y) * alpha) * SCALE,
            );
        this.current.players.forEach((player, index) => {
            let avatar = this.avatars.get(index);
            if (!player.active) {
                if (avatar) avatar.container.visible = false;
                return;
            }
            if (!avatar) {
                const container = new Container();
                const body = new Graphics();
                const letter = this.text(String.fromCharCode(65 + index), 22, 0x0b2530);
                letter.style.fontWeight = 'bold';
                letter.anchor.set(0.5);
                container.addChild(body, letter);
                this.scene.addChild(container);
                avatar = { container, body };
                this.avatars.set(index, avatar);
            }
            avatar.container.visible = true;
            const before = this.previous.players[index];
            position(avatar.container, before?.active ? before : player, player);
            const shooting =
                index === this.session.seat
                    ? this.keys.has('KeyX') || this.keys.has('Space')
                    : player.shooting;
            if (avatar.shooting !== shooting) {
                avatar.shooting = shooting;
                this.drawPlayer(
                    avatar.body,
                    index % 2 === 0 ? COLORS.blue : COLORS.orange,
                    shooting,
                );
            }
        });
        const own =
            this.session.seat === null ? undefined : this.avatars.get(this.session.seat)?.container;
        this.resetLabel.text = this.session.canReset ? 'Reset wyniku' : 'Reset: gospodarz';
        this.subtitle.text = this.session.label;
        this.diagnostics.text = new URLSearchParams(location.search).has('debug')
            ? this.session.debug
            : '';
        position(this.ball, this.previous.ball, this.current.ball);
        this.scoreboard.text = `${this.current.score[0]}  :  ${this.current.score[1]}`;
        const distance = Math.hypot(
            this.current.ball.x - this.current.player.x,
            this.current.ball.y - this.current.player.y,
        );
        const inRange = distance < RULES.playerRadius + RULES.ballRadius + RULES.kickRange;
        this.status.text =
            this.session.status ??
            (this.current.phase === 'goal'
                ? 'Nowa akcja za chwilę — graj dalej!'
                : inRange
                  ? 'Piłka w zasięgu — X / SPACJA'
                  : 'Podejdź do piłki i strzel w kierunku bramki');
        this.announcement.text =
            this.current.phase === 'goal'
                ? `GOL!  ${this.current.lastScorer === 'left' ? 'NIEBIESCY' : 'POMARAŃCZOWI'}`
                : '';
        this.aim.clear();
        if (inRange && own?.visible) {
            this.aim.circle(own.x, own.y, (RULES.playerRadius + RULES.kickRange) * SCALE).stroke({
                color: this.current.kickReady ? COLORS.blue : COLORS.muted,
                alpha: 0.5,
                width: 2,
            });
            const dx = this.ball.x - own.x,
                dy = this.ball.y - own.y,
                d = Math.hypot(dx, dy);
            if (d > 0)
                this.aim
                    .moveTo(this.ball.x, this.ball.y)
                    .lineTo(this.ball.x + (dx / d) * 65, this.ball.y + (dy / d) * 65)
                    .stroke({ color: COLORS.ink, alpha: 0.5, width: 2 });
        }
    }
    dispose() {
        if (this.disposed) return;
        this.disposed = true;
        this.listeners.abort();
        this.app.ticker.remove(this.update);
        this.app.renderer.off('resize', this.resize);
        this.scene.destroy({ children: true });
        this.session.dispose();
    }
}
