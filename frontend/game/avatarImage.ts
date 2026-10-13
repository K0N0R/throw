import { Texture } from 'pixi.js';
import { validAvatar } from '../../shared/game/avatars';

const pngCache = new Map<string, string>();
export function avatarToBase64(emoji: string) {
    if (!validAvatar(emoji)) throw new Error('Wybierz jedno emoji.');
    const cached = pngCache.get(emoji);
    if (cached) return cached;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Nie można wygenerować avatara.');
    const font = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.font = `96px ${font}`;
    let metrics = ctx.measureText(emoji);
    const width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    if (width > 112) {
        ctx.font = `${Math.floor((96 * 112) / width)}px ${font}`;
        metrics = ctx.measureText(emoji);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(
        emoji,
        (128 - metrics.actualBoundingBoxLeft - metrics.actualBoundingBoxRight) / 2 +
            metrics.actualBoundingBoxLeft,
        (128 + metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2,
    );
    const data = canvas.toDataURL('image/png');
    if (pngCache.size >= 64) pngCache.delete(pngCache.keys().next().value!);
    pngCache.set(emoji, data);
    return data;
}

// Textures belong to one GameView; late loads cannot recreate resources after leaving.
export class AvatarTextures {
    private textures = new Map<string, Promise<Texture>>();
    private disposed = false;
    get(emoji: string): Promise<Texture> {
        const cached = this.textures.get(emoji);
        if (cached) return cached;
        const promise = (async () => {
            const image = new Image();
            image.src = avatarToBase64(emoji);
            await image.decode();
            if (this.disposed) throw new Error('Sesja avatara zakończona.');
            return Texture.from(image);
        })();
        this.textures.set(emoji, promise);
        return promise;
    }
    dispose() {
        this.disposed = true;
        for (const texture of this.textures.values())
            void texture.then(
                (value) => value.destroy(true),
                () => {},
            );
        this.textures.clear();
    }
}
