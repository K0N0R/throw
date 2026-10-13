import { Container, Graphics } from 'pixi.js';
import { Typography } from '../core/containers/components/typography';
import { resolveAvatar } from '../../shared/game/avatars';
import type { RoomMember } from '../../shared/game/lobbyProtocol';
import type { GameSnapshot } from '../../shared/game/simulation';
import { GameCamera, edgeIndicator, GAME_VIEWPORT } from './camera';

export class OffscreenPlayers {
    readonly element = new Container();
    private markers = new Map<
        number,
        { container: Container; arrow: Graphics; label: Typography; name: Typography }
    >();
    render(
        state: GameSnapshot,
        camera: GameCamera,
        seat: number | null,
        profiles: readonly Pick<RoomMember, 'seat' | 'nick' | 'avatar'>[],
    ) {
        for (const marker of this.markers.values()) marker.container.visible = false;
        const targets = [
            ...state.players.map((player, index) => ({ player, index, ball: false })),
            { player: { ...state.ball, active: true }, index: -1, ball: true },
        ];
        const occupied: { x: number; y: number }[] = [];
        for (const { player, index, ball } of targets) {
            if (!player.active || index === seat) continue;
            const projected = camera.screen(player);
            const indicator = edgeIndicator(projected);
            if (!indicator) continue;
            const vertical =
                Math.abs(indicator.x - (GAME_VIEWPORT.x + 30)) < 1 ||
                Math.abs(indicator.x - (GAME_VIEWPORT.x + GAME_VIEWPORT.width - 30)) < 1;
            const base = vertical ? indicator.y : indicator.x;
            for (const offset of [0, 48, -48, 96, -96, 144, -144, 192, -192, 240, -240]) {
                const coordinate = Math.max(
                    (vertical ? GAME_VIEWPORT.y : GAME_VIEWPORT.x) + 30,
                    Math.min(
                        (vertical
                            ? GAME_VIEWPORT.y + GAME_VIEWPORT.height
                            : GAME_VIEWPORT.x + GAME_VIEWPORT.width) - 30,
                        base + offset,
                    ),
                );
                const candidate = {
                    x: vertical ? indicator.x : coordinate,
                    y: vertical ? coordinate : indicator.y,
                };
                if (
                    occupied.every(
                        (point) => Math.hypot(point.x - candidate.x, point.y - candidate.y) >= 45,
                    )
                ) {
                    Object.assign(indicator, candidate);
                    break;
                }
            }
            indicator.angle = Math.atan2(projected.y - indicator.y, projected.x - indicator.x);
            occupied.push({ x: indicator.x, y: indicator.y });
            let marker = this.markers.get(index);
            if (!marker) {
                const container = new Container(),
                    arrow = new Graphics(),
                    label = new Typography({ text: '', size: 24, color: 0xffffff }),
                    name = new Typography({ text: '', size: 14, color: 0xe6eef4 });
                name.position.y = 22;
                container.addChild(arrow, label, name);
                this.element.addChild(container);
                marker = { container, arrow, label, name };
                this.markers.set(index, marker);
            }
            const color = ball ? 0xfff5df : index % 2 === 0 ? 0x6bbcff : 0xffaa69;
            marker.container.visible = true;
            marker.container.position.set(indicator.x, indicator.y);
            marker.arrow.clear().moveTo(14, -8).lineTo(27, 0).lineTo(14, 8).closePath().fill(color);
            marker.arrow.rotation = indicator.angle;
            const member = profiles.find((p) => p.seat === index);
            marker.label.text = ball ? '⚽' : resolveAvatar(member?.avatar);
            marker.name.text = ball ? 'Piłka' : (member?.nick ?? String.fromCharCode(65 + index));
            marker.name.position.x =
                Math.max(
                    GAME_VIEWPORT.x + 90,
                    Math.min(GAME_VIEWPORT.x + GAME_VIEWPORT.width - 90, indicator.x),
                ) - indicator.x;
        }
    }
}
