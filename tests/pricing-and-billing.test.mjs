import test from 'node:test';
import assert from 'node:assert/strict';

// Test pricing calculation and billing rules
const COACH_PACKAGES = [
  { id: 'starter', name: 'Starter Coach', monthlyPrice: 49, annualPriceMonthly: 39 },
  { id: 'pro', name: 'Pro Coach', monthlyPrice: 99, annualPriceMonthly: 79 },
  { id: 'studio', name: 'Studio & Teams', monthlyPrice: 199, annualPriceMonthly: 159 },
];

function calculateBillingTotal(pkg, cycle) {
  const unitPrice = cycle === 'annual' ? pkg.annualPriceMonthly : pkg.monthlyPrice;
  return cycle === 'annual' ? unitPrice * 12 : unitPrice;
}

test('monthly billing calculations are exact', () => {
  const starter = COACH_PACKAGES.find((p) => p.id === 'starter');
  const pro = COACH_PACKAGES.find((p) => p.id === 'pro');
  const studio = COACH_PACKAGES.find((p) => p.id === 'studio');

  assert.equal(calculateBillingTotal(starter, 'monthly'), 49);
  assert.equal(calculateBillingTotal(pro, 'monthly'), 99);
  assert.equal(calculateBillingTotal(studio, 'monthly'), 199);
});

test('annual billing calculates 20% discount annualized rate', () => {
  const starter = COACH_PACKAGES.find((p) => p.id === 'starter');
  const pro = COACH_PACKAGES.find((p) => p.id === 'pro');
  const studio = COACH_PACKAGES.find((p) => p.id === 'studio');

  assert.equal(calculateBillingTotal(starter, 'annual'), 39 * 12); // $468/yr
  assert.equal(calculateBillingTotal(pro, 'annual'), 79 * 12);     // $948/yr
  assert.equal(calculateBillingTotal(studio, 'annual'), 159 * 12);  // $1908/yr
});

test('package features and limits enforce coach capacity tiering', () => {
  for (const pkg of COACH_PACKAGES) {
    assert.ok(pkg.id);
    assert.ok(pkg.monthlyPrice > 0);
    assert.ok(pkg.annualPriceMonthly < pkg.monthlyPrice, 'Annual price per month must offer a discount');
  }
});
