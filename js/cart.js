import { findProduct } from './data.js';

export const money = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(value);

export function localToday(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function calendarTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1000 || year > 9999) return null;
  const time = Date.UTC(year, month - 1, day);
  const date = new Date(time);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? time : null;
}

export function rentalDays(startDate, endDate) {
  const start = calendarTime(startDate);
  const end = calendarTime(endDate);
  return start !== null && end !== null && end > start ? (end - start) / 86400000 : 0;
}

export function validateDates(startDate, endDate, today = localToday()) {
  if (calendarTime(startDate) === null) return { field: 'start-date', message: 'Pilih tanggal pengambilan yang valid.' };
  if (startDate < today) return { field: 'start-date', message: 'Tanggal pengambilan tidak boleh sebelum hari ini.' };
  if (calendarTime(endDate) === null) return { field: 'end-date', message: 'Pilih tanggal pengembalian yang valid.' };
  if (!rentalDays(startDate, endDate)) return { field: 'end-date', message: 'Tanggal pengembalian harus setelah tanggal pengambilan.' };
  return null;
}

export const validQuantity = (value) => Number.isInteger(value) && value >= 1 && value <= 99;

export function setQuantity(items, productId, quantity) {
  if (!findProduct(productId) || !validQuantity(quantity)) throw new RangeError('Jumlah harus bilangan bulat antara 1 dan 99.');
  const exists = items.some((item) => item.productId === productId);
  return exists ? items.map((item) => item.productId === productId ? { productId, quantity } : item) : [...items, { productId, quantity }];
}

export const removeItem = (items, productId) => items.filter((item) => item.productId !== productId);

export function quote(state) {
  const days = rentalDays(state.startDate, state.endDate);
  const lines = state.items.flatMap((item) => {
    const product = findProduct(item.productId);
    return product && validQuantity(item.quantity) ? [{ ...product, quantity: item.quantity, subtotal: product.dailyPrice * item.quantity * days }] : [];
  });
  return { days, lines, units: lines.reduce((sum, line) => sum + line.quantity, 0), total: lines.reduce((sum, line) => sum + line.subtotal, 0) };
}

export function displayDate(value) {
  const time = calendarTime(value);
  return time === null ? 'Belum dipilih' : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(time));
}
