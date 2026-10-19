import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, PRODUCTS, filterProducts } from '../js/data.js';
import { calendarTime, localToday, quote, rentalDays, setQuantity, validateDates } from '../js/cart.js';
import { emptyState, loadState, sanitizeState, saveState } from '../js/storage.js';
import { buildMessage, buildWhatsAppUrl, normalizePhone, validBusinessNumber, validateCheckout } from '../js/checkout.js';

const state = () => ({ ...emptyState(), items: [{ productId: 'tenda-2p', quantity: 2 }, { productId: 'matras', quantity: 1 }], startDate: '2096-11-10', endDate: '2096-11-12' });
const contact = { name: 'Pendaki <A> & "B"', phone: '+62 812-3456-7890' };

test('10 unique products cover all 5 categories and combine search/filter', () => {
  assert.equal(PRODUCTS.length, 10);
  assert.equal(new Set(PRODUCTS.map((product) => product.id)).size, 10);
  for (const category of CATEGORIES.slice(1)) assert.ok(PRODUCTS.some((product) => product.category === category.id));
  assert.equal(filterProducts(' TENDA ', 'tenda').length, 2);
  assert.equal(filterProducts('tenda', 'carrier').length, 0);
  assert.equal(filterProducts('', 'all').length, 10);
});

test('calendar calculations span months, years, and leap day without local timezone drift', () => {
  assert.equal(rentalDays('2096-01-31', '2096-02-01'), 1);
  assert.equal(rentalDays('2095-12-31', '2096-01-01'), 1);
  assert.equal(rentalDays('2096-02-28', '2096-03-01'), 2);
  assert.equal(rentalDays('2097-02-28', '2097-03-01'), 1);
  assert.equal(calendarTime('2097-02-29'), null);
  assert.equal(calendarTime('2096-04-31'), null);
  assert.equal(calendarTime('2096-2-1'), null);
  assert.equal(calendarTime(null), null);
  assert.equal(rentalDays('2096-11-12', '2096-11-10'), 0);
  assert.equal(rentalDays('2096-11-10', '2096-11-10'), 0);
  assert.equal(localToday(new Date(2026, 9, 19, 0, 1)), '2026-10-19');
});

test('date rules reject past start dates and same-day return', () => {
  assert.equal(validateDates('2096-11-10', '2096-11-12', '2096-11-10'), null);
  assert.equal(validateDates('2096-11-09', '2096-11-12', '2096-11-10').field, 'start-date');
  assert.equal(validateDates('2096-11-10', '2096-11-10', '2096-11-10').field, 'end-date');
});

test('cart merges same ID, rejects invalid quantities, and calculates Rp220000 from current catalogue', () => {
  let items = setQuantity([], 'tenda-2p', 1);
  items = setQuantity(items, 'tenda-2p', 2);
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, 2);
  for (const value of [0, -1, 1.5, 100, NaN, '2']) assert.throws(() => setQuantity(items, 'tenda-2p', value), RangeError);
  assert.throws(() => setQuantity(items, 'unknown', 1), RangeError);
  const draft = state();
  draft.items[0].dailyPrice = 1;
  assert.equal(quote(draft).total, 220000);
  assert.equal(quote(draft).units, 3);
});

test('storage excludes contacts and prices; corrupted and denied storage recover safely', () => {
  let stored;
  const storage = { setItem: (_, value) => { stored = value; }, getItem: () => stored };
  assert.ok(saveState({ ...state(), name: 'Private', phone: '081234567890' }, () => storage));
  assert.equal(stored.includes('Private'), false);
  assert.equal(stored.includes('phone'), false);
  assert.deepEqual(loadState(() => storage).state, state());
  assert.equal(loadState(() => ({ getItem: () => '{bad' })).failed, true);
  assert.equal(loadState(() => { throw Error('denied'); }).failed, true);
  assert.equal(saveState(state(), () => { throw Error('quota'); }), false);
  assert.deepEqual(sanitizeState({ schemaVersion: 2, items: state().items }), emptyState());
});

test('storage drops unknown IDs, invalid quantities, duplicate items, past/invalid dates and injected fields', () => {
  const draft = state();
  draft.items.push({ productId: 'unknown', quantity: 2 }, { productId: 'kompor', quantity: 100 }, { productId: 'matras', quantity: 5 }, null);
  draft.items[0].dailyPrice = 1;
  assert.deepEqual(sanitizeState(draft, '2096-11-10'), state());
  assert.equal(sanitizeState(draft, '2096-11-11').startDate, '');
  assert.equal(sanitizeState({ ...draft, endDate: '2096-11-09' }, '2096-11-10').endDate, '');
});

test('contact validation supports local and international phones and rejects malformed input', () => {
  assert.equal(normalizePhone('0812 3456 7890'), '6281234567890');
  assert.equal(normalizePhone('+62 (812) 3456-7890'), '6281234567890');
  for (const value of ['123', '0812<script>', '0812+3456789', '1234567890123456']) assert.equal(normalizePhone(value), '');
  assert.equal(validateCheckout(state(), contact), null);
  assert.equal(validateCheckout(emptyState(), contact).field, 'cart-heading');
  assert.equal(validateCheckout(state(), { ...contact, name: ' ' }).field, 'customer-name');
  assert.equal(validateCheckout(state(), { ...contact, name: 'A\nB' }).field, 'customer-name');
  assert.equal(validateCheckout(state(), { ...contact, phone: 'abc' }).field, 'customer-phone');
});

test('WhatsApp draft is encoded and includes complete estimate without automatic reservation claims', () => {
  const message = buildMessage(state(), contact);
  assert.ok(message.includes('220.000'));
  assert.ok(message.includes('Tenda Dome 2 Orang × 2'));
  assert.ok(message.includes('belum merupakan reservasi'));
  // Non-routable test number is used only to inspect generated URLs; no messages are sent.
  const url = new URL(buildWhatsAppUrl('12025550123', state(), contact));
  assert.equal(url.hostname, 'wa.me');
  assert.equal(url.searchParams.get('text'), message);
  assert.equal(validBusinessNumber(''), false);
  assert.equal(validBusinessNumber('+62812345678'), false);
  assert.throws(() => buildWhatsAppUrl('', state(), contact));
});
