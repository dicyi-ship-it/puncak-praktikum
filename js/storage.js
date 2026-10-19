import { findProduct } from './data.js';
import { calendarTime, localToday, rentalDays, validQuantity } from './cart.js';

export const STORAGE_KEY = 'puncak-rental:cart:v1';
export const emptyState = () => ({ schemaVersion: 1, items: [], startDate: '', endDate: '' });

export function sanitizeState(value, today = localToday()) {
  const state = emptyState();
  if (!value || value.schemaVersion !== 1) return state;
  const seen = new Set();
  if (Array.isArray(value.items)) {
    for (const item of value.items) {
      if (!item || !findProduct(item.productId) || !validQuantity(item.quantity) || seen.has(item.productId)) continue;
      seen.add(item.productId);
      state.items.push({ productId: item.productId, quantity: item.quantity });
    }
  }
  if (calendarTime(value.startDate) !== null && value.startDate >= today) {
    state.startDate = value.startDate;
    if (rentalDays(value.startDate, value.endDate)) state.endDate = value.endDate;
  }
  return state;
}

export function loadState(getStorage = () => globalThis.localStorage) {
  try {
    const raw = getStorage().getItem(STORAGE_KEY);
    return { state: sanitizeState(raw ? JSON.parse(raw) : null), failed: false };
  } catch {
    return { state: emptyState(), failed: true };
  }
}

export function saveState(state, getStorage = () => globalThis.localStorage) {
  try {
    // Whitelist excludes contact information and derived prices, even if state grows later.
    const safe = { schemaVersion: 1, items: state.items.map(({ productId, quantity }) => ({ productId, quantity })), startDate: state.startDate, endDate: state.endDate };
    getStorage().setItem(STORAGE_KEY, JSON.stringify(safe));
    return true;
  } catch {
    return false;
  }
}
