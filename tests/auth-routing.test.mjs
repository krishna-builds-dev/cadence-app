import test from 'node:test';
import assert from 'node:assert/strict';

// Test HASH_TO_VIEW router matching logic from App.tsx
const HASH_TO_VIEW = {
  '#signup': 'signup',
  '#login': 'signup',
  '#dashboard': 'dashboard',
};

function hashToView(hash) {
  const normalized = hash.toLowerCase();
  for (const [key, view] of Object.entries(HASH_TO_VIEW)) {
    if (normalized.startsWith(key)) return view;
  }
  return 'landing';
}

test('hashToView routes empty or unknown hash to landing view', () => {
  assert.equal(hashToView(''), 'landing');
  assert.equal(hashToView('#unknown'), 'landing');
  assert.equal(hashToView('#how-it-works'), 'landing');
  assert.equal(hashToView('#pricing'), 'landing');
});

test('hashToView correctly routes auth endpoints', () => {
  assert.equal(hashToView('#signup'), 'signup');
  assert.equal(hashToView('#SIGNUP'), 'signup');
  assert.equal(hashToView('#login'), 'signup');
  assert.equal(hashToView('#login?ref=pricing'), 'signup');
});

test('hashToView correctly routes dashboard views', () => {
  assert.equal(hashToView('#dashboard'), 'dashboard');
  assert.equal(hashToView('#DASHBOARD'), 'dashboard');
  assert.equal(hashToView('#dashboard?tab=billing'), 'dashboard');
});
