import { Container, Graphics } from 'pixi.js';
import { ARENA_SKINS, arenaSettings, arenaShape } from '../../shared/game/arenas';
import { RULES, type GameSnapshot } from '../../shared/game/simulation';

export class ArenaView {
    readonly element = new Container();
    private key = '';
    configure(value: unknown, scale = 50, kickoffTeam: GameSnapshot['kickoffTeam'] = null) {
        const settings = arenaSettings(value),
            key = JSON.stringify([settings, scale, kickoffTeam]);
        if (key === this.key) return;
        this.key = key;
        for (const child of this.element.removeChildren()) child.destroy({ children: true });
        const { width, height, cornerRadius, goalHeight, goalDepth } = arenaShape(settings),
            skin = ARENA_SKINS[settings.skin];
        const w = width * scale,
            h = height * scale,
            r = cornerRadius * scale;
        const surround = new Graphics()
            .roundRect(-goalDepth * scale - 40, -30, w + goalDepth * scale * 2 + 80, h + 60, 24)
            .fill(skin.surround);
        const ground = new Graphics().roundRect(0, 0, w, h, r).fill(skin.ground);
        const stripes = new Graphics(),
            clip = new Graphics().roundRect(0, 0, w, h, r).fill(0xffffff);
        for (let i = 0; i < 12; i += 2)
            stripes.rect((i * w) / 12, 0, w / 12, h).fill({ color: skin.stripe, alpha: 0.55 });
        stripes.mask = clip;
        const lines = new Graphics()
            .roundRect(0, 0, w, h, r)
            .stroke({ color: skin.line, width: 2, alpha: 0.7 });
        lines
            .moveTo(w / 2, 0)
            .lineTo(w / 2, h)
            .stroke({ color: skin.line, width: 2, alpha: 0.4 });
        lines
            .circle(w / 2, h / 2, RULES.centerCircleRadius * scale)
            .stroke({ color: skin.line, width: 2, alpha: 0.4 });
        lines.circle(w / 2, h / 2, 4).fill(skin.line);
        const goals = new Graphics(),
            gh = goalHeight * scale,
            gy = (h - gh) / 2,
            gd = goalDepth * scale;
        for (const [x, color] of [
            [-gd, 0x6bbcff],
            [w, 0xffaa69],
        ] as const) {
            goals.rect(x, gy, gd, gh).fill({ color, alpha: 0.12 }).stroke({ color, width: 3 });
            for (let i = 1; i < 5; i++)
                goals
                    .moveTo(x + (i * gd) / 5, gy)
                    .lineTo(x + (i * gd) / 5, gy + gh)
                    .stroke({ color, alpha: 0.2, width: 1 });
            for (let i = 1; i < 9; i++)
                goals
                    .moveTo(x, gy + (i * gh) / 9)
                    .lineTo(x + gd, gy + (i * gh) / 9)
                    .stroke({ color, alpha: 0.2, width: 1 });
        }
        this.element.addChild(surround, ground, stripes, clip, lines, goals);
        if (kickoffTeam !== null) {
            const radius = RULES.centerCircleRadius * scale;
            const barrier = new Graphics()
                .moveTo(w / 2, 0)
                .lineTo(w / 2, h / 2 - radius)
                .arc(w / 2, h / 2, radius, -Math.PI / 2, Math.PI / 2, kickoffTeam === 'right')
                .lineTo(w / 2, h)
                .stroke({
                    color: kickoffTeam === 'left' ? 0xffaa69 : 0x6bbcff,
                    width: 3,
                    alpha: 0.85,
                });
            this.element.addChild(barrier);
            const midfield = new Graphics()
                .moveTo(w / 2, h / 2 - radius)
                .lineTo(w / 2, h / 2 + radius)
                .stroke({
                    color: kickoffTeam === 'left' ? 0x6bbcff : 0xffaa69,
                    width: 3,
                    alpha: 0.85,
                });
            this.element.addChild(midfield);
        }
    }
}
