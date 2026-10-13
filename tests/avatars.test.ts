import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_AVATAR,
    LEGENDARY_AVATARS,
    POPULAR_AVATARS,
    validAvatar,
    resolveAvatar,
} from '../shared/game/avatars';

test('legacy legendary avatars and popular choices are valid single emoji', () => {
    assert.equal(LEGENDARY_AVATARS.length, 20);
    for (const emoji of [DEFAULT_AVATAR, ...LEGENDARY_AVATARS, ...POPULAR_AVATARS])
        assert.ok(validAvatar(emoji), emoji);
});
test('emoji validation supports skin tones, families, flags and keycaps without splitting UTF-16', () => {
    for (const emoji of ['👮🏻', '👨‍👩‍👧‍👦', '🇵🇱', '1️⃣', '❤️', '🏳️‍🌈']) assert.ok(validAvatar(emoji), emoji);
    for (const value of [
        '',
        'A',
        'abc',
        '🐻🐻',
        '🐻a',
        '🐻\n',
        'data:image/png;base64,abc',
        '😀'.repeat(30),
        null,
        42,
    ])
        assert.equal(validAvatar(value), false, String(value));
});

test('legacy missing or malformed avatar uses a displayable default rather than undefined', () => {
    for (const avatar of [undefined, null, '', 'undefined', 'not an emoji', '🐻🐻']) {
        assert.equal(resolveAvatar(avatar), DEFAULT_AVATAR);
    }
    assert.equal(resolveAvatar('🤖'), '🤖');
    assert.equal(resolveAvatar('👮🏻'), '👮🏻');
});
