/* ==========================================================
   scripts/test-invoice-engine.js

   Automated test suite for assets/js/invoice-engine.js.
   No test framework dependency — plain Node assertions with a
   tiny runner, so `node scripts/test-invoice-engine.js` is all
   that's needed (matches the site's zero-dependency policy).
========================================================== */
'use strict';

const assert = require('assert');
const path = require('path');
const Engine = require(path.join(__dirname, '..', 'assets', 'js', 'invoice-engine.js'));

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failed++;
    failures.push({ name, err });
  }
}

function approxEqual(a, b, msg) {
  assert.ok(Math.abs(a - b) < 0.001, `${msg || ''} expected ${b}, got ${a}`);
}

function item(description, quantity, unitPrice, taxable) {
  return { description, quantity, unitPrice, taxable: taxable !== false };
}

// ---------------------------------------------------------------------------
// BASIC
// ---------------------------------------------------------------------------
test('basic: one item, no tax/discount/shipping', () => {
  const r = Engine.calculateInvoice({ items: [item('Widget', 1, 100)] });
  approxEqual(r.subtotal, 100, 'subtotal');
  approxEqual(r.total, 100, 'total');
  approxEqual(r.balanceDue, 100, 'balanceDue');
});

test('basic: multiple items sum correctly', () => {
  const r = Engine.calculateInvoice({
    items: [item('A', 2, 10), item('B', 3, 5), item('C', 1, 99.99)]
  });
  approxEqual(r.subtotal, 20 + 15 + 99.99, 'subtotal');
});

test('basic: classic floating point trap (19.99 x 3)', () => {
  const r = Engine.calculateInvoice({ items: [item('Item', 3, 19.99)] });
  approxEqual(r.subtotal, 59.97, 'subtotal must be exactly 59.97, not 59.96999999999999');
});

// ---------------------------------------------------------------------------
// DISCOUNTS
// ---------------------------------------------------------------------------
test('discount: 0% changes nothing', () => {
  const r = Engine.calculateInvoice({
    items: [item('Item', 1, 200)], discountType: 'percent', discountValue: 0
  });
  approxEqual(r.discountAmount, 0, 'discountAmount');
  approxEqual(r.total, 200, 'total');
});

test('discount: 10% percent discount', () => {
  const r = Engine.calculateInvoice({
    items: [item('Item', 1, 200)], discountType: 'percent', discountValue: 10
  });
  approxEqual(r.discountAmount, 20, 'discountAmount');
  approxEqual(r.total, 180, 'total');
});

test('discount: 50% percent discount', () => {
  const r = Engine.calculateInvoice({
    items: [item('Item', 1, 200)], discountType: 'percent', discountValue: 50
  });
  approxEqual(r.discountAmount, 100, 'discountAmount');
  approxEqual(r.total, 100, 'total');
});

test('discount: 100% percent discount zeroes the total', () => {
  const r = Engine.calculateInvoice({
    items: [item('Item', 1, 200)], discountType: 'percent', discountValue: 100, taxRate: 20
  });
  approxEqual(r.discountAmount, 200, 'discountAmount');
  approxEqual(r.taxAmount, 0, 'tax on a fully-discounted invoice must be 0');
  approxEqual(r.total, 0, 'total');
});

test('discount: fixed discount larger than subtotal is clamped, never negative', () => {
  const r = Engine.calculateInvoice({
    items: [item('Item', 1, 50)], discountType: 'fixed', discountValue: 500
  });
  approxEqual(r.discountAmount, 50, 'discount clamped to subtotal');
  approxEqual(r.total, 0, 'total never goes negative');
});

test('discount: percent value over 100 is clamped to 100', () => {
  const r = Engine.calculateInvoice({
    items: [item('Item', 1, 50)], discountType: 'percent', discountValue: 250
  });
  approxEqual(r.total, 0, 'total never goes negative from an over-100% discount');
});

// ---------------------------------------------------------------------------
// TAX
// ---------------------------------------------------------------------------
test('tax: 0%', () => {
  const r = Engine.calculateInvoice({ items: [item('Item', 1, 100)], taxRate: 0 });
  approxEqual(r.taxAmount, 0, 'taxAmount');
});

test('tax: 5%', () => {
  const r = Engine.calculateInvoice({ items: [item('Item', 1, 100)], taxRate: 5 });
  approxEqual(r.taxAmount, 5, 'taxAmount');
  approxEqual(r.total, 105, 'total');
});

test('tax: 10%', () => {
  const r = Engine.calculateInvoice({ items: [item('Item', 1, 250)], taxRate: 10 });
  approxEqual(r.taxAmount, 25, 'taxAmount');
});

test('tax: 20%', () => {
  const r = Engine.calculateInvoice({ items: [item('Item', 1, 100)], taxRate: 20 });
  approxEqual(r.taxAmount, 20, 'taxAmount');
});

test('tax: non-taxable items are excluded from the tax base', () => {
  const r = Engine.calculateInvoice({
    items: [item('Taxable', 1, 100, true), item('Non-taxable', 1, 100, false)],
    taxRate: 10
  });
  approxEqual(r.taxAmount, 10, 'tax only applies to the taxable line');
  approxEqual(r.total, 100 + 100 + 10, 'total');
});

// ---------------------------------------------------------------------------
// COMBINED (items + discount + tax + shipping)
// ---------------------------------------------------------------------------
test('combined: items + 10% discount + 8% tax + shipping', () => {
  const r = Engine.calculateInvoice({
    items: [item('A', 2, 50), item('B', 1, 25)], // subtotal 125
    discountType: 'percent', discountValue: 10,   // -12.50 -> 112.50
    taxRate: 8,                                    // +9.00 -> 121.50
    shipping: 15                                   // +15 -> 136.50
  });
  approxEqual(r.subtotal, 125, 'subtotal');
  approxEqual(r.discountAmount, 12.5, 'discountAmount');
  approxEqual(r.taxAmount, 9, 'taxAmount');
  approxEqual(r.total, 136.5, 'total');
});

test('combined: amountPaid produces correct balanceDue and status', () => {
  const r = Engine.calculateInvoice({
    items: [item('A', 1, 100)], taxRate: 10, amountPaid: 55
  });
  approxEqual(r.total, 110, 'total');
  approxEqual(r.balanceDue, 55, 'balanceDue');
  assert.strictEqual(r.status, 'Partially Paid');
});

test('combined: full payment marks Paid', () => {
  const r = Engine.calculateInvoice({ items: [item('A', 1, 100)], amountPaid: 100 });
  approxEqual(r.balanceDue, 0, 'balanceDue');
  assert.strictEqual(r.status, 'Paid');
});

test('combined: past due date with balance remaining is Overdue', () => {
  const r = Engine.calculateInvoice({ items: [item('A', 1, 100)], dueDate: '2020-01-01' });
  assert.strictEqual(r.status, 'Overdue');
  assert.strictEqual(r.isOverdue, true);
});

test('combined: future due date with balance remaining is Unpaid, not Overdue', () => {
  const r = Engine.calculateInvoice({ items: [item('A', 1, 100)], dueDate: '2099-01-01' });
  assert.strictEqual(r.status, 'Unpaid');
  assert.strictEqual(r.isOverdue, false);
});

// ---------------------------------------------------------------------------
// CURRENCY (formatting round-trip for every supported currency)
// ---------------------------------------------------------------------------
['USD', 'GBP', 'CAD', 'AUD', 'NZD', 'EUR'].forEach((code) => {
  test(`currency: ${code} formats without throwing and contains the amount`, () => {
    const formatted = Engine.formatCurrency(1234.5, code);
    assert.ok(typeof formatted === 'string' && formatted.length > 0, 'formatted string');
    assert.ok(/1,?234\.50/.test(formatted), `formatted output "${formatted}" should contain 1234.50`);
  });
});

// ---------------------------------------------------------------------------
// EDGE CASES
// ---------------------------------------------------------------------------
test('edge: decimals throughout', () => {
  const r = Engine.calculateInvoice({
    items: [item('A', 2.5, 19.99)], discountType: 'percent', discountValue: 7.5, taxRate: 6.25
  });
  assert.ok(isFinite(r.total) && !isNaN(r.total));
});

test('edge: very large values do not overflow to Infinity/NaN', () => {
  const r = Engine.calculateInvoice({ items: [item('A', 999999, 999999)] });
  assert.ok(isFinite(r.total), 'total is finite');
  assert.ok(!isNaN(r.total), 'total is not NaN');
});

test('edge: zero quantity and zero price produce a zero line, not NaN', () => {
  const r = Engine.calculateInvoice({ items: [item('Free sample', 0, 0)] });
  approxEqual(r.total, 0, 'total');
  assert.ok(!isNaN(r.total));
});

test('edge: invalid/garbage numeric strings never produce NaN', () => {
  const r = Engine.calculateInvoice({
    items: [{ description: 'A', quantity: 'abc', unitPrice: 'xyz' }],
    discountValue: 'not-a-number',
    taxRate: 'nope',
    shipping: 'nah',
    amountPaid: '???'
  });
  assert.ok(!isNaN(r.total), 'total');
  assert.ok(!isNaN(r.balanceDue), 'balanceDue');
  approxEqual(r.total, 0, 'garbage input degrades safely to 0, not a crash');
});

test('edge: negative input is clamped rather than producing a negative total', () => {
  const r = Engine.calculateInvoice({
    items: [item('A', -5, -10)], shipping: -20, amountPaid: -50
  });
  assert.ok(r.total >= 0, 'total never negative from bad input');
  assert.ok(r.subtotal >= 0, 'subtotal never negative from bad input');
});

test('edge: empty items array degrades safely (caller should validate first)', () => {
  const r = Engine.calculateInvoice({ items: [] });
  approxEqual(r.total, 0, 'total');
});

test('edge: no items key at all', () => {
  const r = Engine.calculateInvoice({});
  approxEqual(r.total, 0, 'total');
});

test('edge: Infinity/NaN passed directly as numbers is neutralized', () => {
  const r = Engine.calculateInvoice({
    items: [{ description: 'A', quantity: Infinity, unitPrice: NaN }]
  });
  assert.ok(isFinite(r.total));
  assert.ok(!isNaN(r.total));
});

// ---------------------------------------------------------------------------
// VALIDATION (user-facing error messages)
// ---------------------------------------------------------------------------
test('validation: empty items array is rejected with a clear message', () => {
  const errors = Engine.validateItems([]);
  assert.ok(errors.length > 0);
  assert.ok(errors[0].message.toLowerCase().includes('line item'));
});

test('validation: missing description is flagged per line', () => {
  const errors = Engine.validateItems([{ description: '', quantity: 1, unitPrice: 1 }]);
  assert.ok(errors.some((e) => e.field.includes('description')));
});

test('validation: negative quantity is flagged', () => {
  const errors = Engine.validateItems([{ description: 'A', quantity: -1, unitPrice: 1 }]);
  assert.ok(errors.some((e) => e.field.includes('quantity')));
});

test('validation: due date before issue date is flagged', () => {
  const errors = Engine.validateInvoice({
    items: [{ description: 'A', quantity: 1, unitPrice: 1 }],
    issueDate: '2026-06-15',
    dueDate: '2026-06-01'
  });
  assert.ok(errors.some((e) => e.field === 'dueDate'));
});

test('validation: same-day issue/due date is allowed', () => {
  const errors = Engine.validateInvoice({
    items: [{ description: 'A', quantity: 1, unitPrice: 1 }],
    issueDate: '2026-06-15',
    dueDate: '2026-06-15'
  });
  assert.ok(!errors.some((e) => e.field === 'dueDate'));
});

// ---------------------------------------------------------------------------
// FILENAME SAFETY
// ---------------------------------------------------------------------------
test('safeFilenamePart strips unsafe characters', () => {
  const f = Engine.safeFilenamePart('INV-0001 / <Acme & Co>? *.pdf');
  assert.ok(!/[\/\\?<>*:"|]/.test(f), `filename fragment "${f}" must not contain illegal chars`);
});

test('safeFilenamePart never returns empty', () => {
  assert.strictEqual(Engine.safeFilenamePart(''), 'invoice');
  assert.strictEqual(Engine.safeFilenamePart('***'), 'invoice');
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log(`\nINVOICE ENGINE TEST REPORT`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
if (failures.length) {
  console.log('\nFailures:');
  failures.forEach((f) => {
    console.log(`  ✕ ${f.name}`);
    console.log(`    ${f.err.message}`);
  });
  process.exitCode = 1;
} else {
  console.log('  All tests passed.');
}
