import { Container, Graphics } from 'pixi.js';
import { Typography } from '../core/containers/components/typography';
import { ENERGY_PADS, ENERGY_RULES } from '../../shared/game/energy';
import type { GameSnapshot } from '../../shared/game/simulation';

export class EnergyView {
    readonly pads = new Container();
    readonly hud = new Container();
    private markers: { graphic: Graphics; timer: Typography; last?: number }[] = [];
    private label = new Typography({
        text: '',
        size: 16,
        fontFamily: 'Arial',
        horizontalAlign: 'left',
        verticalAlign: 'top',
        color: 0xffd16b,
    });
    private bar = new Graphics();
    private lastEnergy = -1;
    constructor(scale: number, offset: { x: number; y: number }) {
        for (const pad of ENERGY_PADS) {
            const marker = new Container();
            marker.position.set(offset.x + pad.x * scale, offset.y + pad.y * scale);
            const graphic = new Graphics();
            const timer = new Typography({
                text: '',
                size: 20,
                fontFamily: 'Arial',
                color: 0x8cabbc,
            });
            marker.addChild(graphic, timer);
            this.pads.addChild(marker);
            this.markers.push({ graphic, timer });
        }
        this.hud.position.set(1240, 108);
        this.bar.position.set(0, 27);
        this.hud.addChild(this.label, this.bar);
    }
    render(state: GameSnapshot, seat: number | null) {
        this.markers.forEach((marker, index) => {
            const cooldown = Math.ceil(state.padCooldowns?.[index] ?? 0);
            if (marker.last === cooldown) return;
            marker.last = cooldown;
            const active = cooldown === 0;
            marker.graphic
                .clear()
                .circle(0, 0, 27)
                .fill({ color: active ? 0xffd16b : 0x081b26, alpha: active ? 0.15 : 0.3 })
                .stroke({
                    color: active ? 0xffd16b : 0x52726d,
                    width: 2,
                    alpha: active ? 0.8 : 0.5,
                });
            if (active)
                marker.graphic
                    .moveTo(2, -13)
                    .lineTo(-10, 2)
                    .lineTo(-1, 2)
                    .lineTo(-4, 13)
                    .lineTo(11, -3)
                    .lineTo(2, -3)
                    .closePath()
                    .fill(0xffd16b);
            marker.timer.text = active ? '' : String(cooldown);
        });
        this.hud.visible = seat !== null;
        if (seat === null) return;
        const energy = Math.round(state.energy?.[seat] ?? 0);
        this.label.text = `ENERGIA ${energy}/${ENERGY_RULES.maximum} · SHIFT`;
        if (energy === this.lastEnergy) return;
        this.lastEnergy = energy;
        this.bar.clear().roundRect(0, 0, 245, 12, 6).fill(0x24424f);
        if (energy > 0)
            this.bar
                .roundRect(
                    0,
                    0,
                    (245 * energy) / ENERGY_RULES.maximum,
                    12,
                    Math.min(6, (245 * energy) / ENERGY_RULES.maximum / 2),
                )
                .fill(0xffd16b);
    }
}
