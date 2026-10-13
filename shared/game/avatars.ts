export const DEFAULT_AVATAR = '🐻';
// Original legendary-player choices from throw_old/src/client/view/login-page.tsx.
export const LEGENDARY_AVATARS = [
    '👽',
    '👻',
    '👥',
    '🐗',
    '🤖',
    '⚽️',
    '💪',
    '🐻',
    '😾',
    '🐒',
    '👴',
    '🎯',
    '🤡',
    '🐴',
    '🐍',
    '🚽',
    '🍍',
    '💎',
    '👮🏻',
    '👨',
] as const;
export const POPULAR_AVATARS = [
    '😀',
    '😎',
    '🥳',
    '😈',
    '👾',
    '🦊',
    '🐱',
    '🐶',
    '🐼',
    '🐸',
    '🦁',
    '🐯',
    '🐙',
    '🦄',
    '🐲',
    '🐝',
    '🦋',
    '🦖',
    '🐧',
    '🦉',
    '🔥',
    '⚡',
    '⭐',
    '🌈',
    '🍉',
    '🍕',
    '🍔',
    '🚀',
    '🎮',
    '🏀',
] as const;
const segments = new Intl.Segmenter('en', { granularity: 'grapheme' });
export function validAvatar(value: unknown): value is string {
    return (
        typeof value === 'string' &&
        value.length <= 32 &&
        [...segments.segment(value)].length === 1 &&
        /\p{Extended_Pictographic}|\p{Regional_Indicator}|[#*0-9]\uFE0F?\u20E3/u.test(value)
    );
}

export function resolveAvatar(value: unknown): string {
    return validAvatar(value) ? value : DEFAULT_AVATAR;
}
