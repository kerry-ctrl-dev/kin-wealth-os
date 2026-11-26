'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { isAllowedOrigin, isSafeSignal, verifyFirebaseIdToken } = require('./security');

test('rejects missing or oversized Firebase tokens without a provider request', async () => {
  let lookupCount = 0;
  const lookup = async () => {
    lookupCount += 1;
    return { statusCode: 200, body: { users: [{ localId: 'user-1' }] } };
  };

  assert.equal(await verifyFirebaseIdToken('', 'public-key', lookup), null);
  assert.equal(await verifyFirebaseIdToken('x'.repeat(8193), 'public-key', lookup), null);
  assert.equal(lookupCount, 0);
});

test('returns the verified Firebase identity instead of client-supplied profile data', async () => {
  const identity = await verifyFirebaseIdToken('valid-token', 'public-key', async () => ({
    statusCode: 200,
    body: { users: [{ localId: 'firebase-user', displayName: 'Verified Name' }] },
  }));

  assert.deepEqual(identity, { uid: 'firebase-user', displayName: 'Verified Name' });
});

test('fails closed when Firebase rejects or cannot verify a token', async () => {
  assert.equal(
    await verifyFirebaseIdToken('bad-token', 'public-key', async () => ({ statusCode: 400, body: {} })),
    null,
  );
  assert.equal(
    await verifyFirebaseIdToken('unavailable-token', 'public-key', async () => {
      throw new Error('provider unavailable');
    }),
    null,
  );
});

test('accepts only configured socket origins', () => {
  assert.equal(isAllowedOrigin('https://chat.example.com', ['https://chat.example.com']), true);
  assert.equal(isAllowedOrigin('https://attacker.example', ['https://chat.example.com']), false);
  assert.equal(isAllowedOrigin(undefined, ['https://chat.example.com']), false);
});

test('limits WebRTC signals to plain JSON objects of bounded size', () => {
  assert.equal(isSafeSignal({ type: 'offer', sdp: 'offer data' }), true);
  assert.equal(isSafeSignal(['unexpected']), false);
  assert.equal(isSafeSignal({ sdp: 'x'.repeat(17000) }), false);
});