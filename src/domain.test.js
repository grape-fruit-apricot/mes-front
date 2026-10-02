import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateProduction, canReceive } from './domain.js';
test('실적 합계, 정수 수량 및 불량 사유 검증', () => {
  assert.equal(validateProduction(100, '97', '3', '외관 불량'), '');
  for (const args of [[100, '', 100, '사유'], [100, 97, 2, '사유'], [100, 97.5, 2.5, '사유'], [100, -1, 101, '사유'], [100, 97, 3, '  ']]) assert.ok(validateProduction(...args));
  assert.equal(validateProduction(100, 0, 100, '전체 불량'), '');
});
test('양품 전량 입고는 실적이 있고 아직 입고되지 않은 경우만 가능', () => {
  assert.equal(canReceive({ resultId: 1, receiptId: null, goodQty: 97 }), true);
  assert.equal(canReceive({ resultId: 1, receiptId: 2, goodQty: 97 }), false);
  assert.equal(canReceive({ resultId: 1, goodQty: 0 }), false);
  assert.equal(canReceive({ goodQty: 97 }), false);
});
