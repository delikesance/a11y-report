import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseViewport } from '../src/viewport.js';

test('parseViewport reads a LARGEURxHAUTEUR size', () => {
  assert.deepEqual(parseViewport('375x812'), {
    name: '375x812', width: 375, height: 812, isMobile: false, hasTouch: false,
  });
});

test('parseViewport resolves the mobile preset with touch emulation', () => {
  assert.deepEqual(parseViewport('mobile'), {
    name: 'mobile', width: 375, height: 812, isMobile: true, hasTouch: true,
  });
});

test('parseViewport resolves the tablet and desktop presets', () => {
  assert.equal(parseViewport('tablet').width, 768);
  assert.equal(parseViewport('desktop').width, 1280);
  assert.equal(parseViewport('desktop').height, 800);
});

for (const value of ['abc', '', '375', '375x', '-1x812', '0x800', '375x0', 'constructor', 'Mobile x']) {
  test(`parseViewport rejects "${value}" with a French message`, () => {
    assert.throws(() => parseViewport(value), /Viewport invalide « .* » : attendu LARGEURxHAUTEUR/);
  });
}
