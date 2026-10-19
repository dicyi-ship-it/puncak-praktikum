import { displayDate, money, quote, validateDates } from './cart.js';

export function normalizePhone(value) {
  const source = value.trim();
  if (!/^\+?[\d\s()-]+$/.test(source)) return '';
  const digits = source.replace(/[\s()+-]/g, '');
  if (!/^\d{8,15}$/.test(digits)) return '';
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  return /^\d{8,15}$/.test(normalized) ? normalized : '';
}

export const validBusinessNumber = (value) => typeof value === 'string' && /^[1-9]\d{7,14}$/.test(value);

export function validateCheckout(state, contact, today) {
  if (!state.items.length) return { field: 'cart-heading', message: 'Tambahkan perlengkapan sebelum memeriksa pengajuan.' };
  const datesError = validateDates(state.startDate, state.endDate, today);
  if (datesError) return datesError;
  const name = contact.name.trim();
  if (name.length < 2 || name.length > 80 || /[\r\n]/.test(name)) return { field: 'customer-name', message: 'Isi nama 2–80 karakter dalam satu baris.' };
  if (!normalizePhone(contact.phone)) return { field: 'customer-phone', message: 'Isi nomor WhatsApp yang valid, 8–15 digit. Awalan 08 atau 62 diperbolehkan.' };
  return null;
}

export function buildMessage(state, contact) {
  const estimate = quote(state);
  return [
    'Halo Puncak Rental, saya ingin mengajukan penyewaan.',
    `Nama: ${contact.name.trim()}`,
    `WhatsApp: ${normalizePhone(contact.phone)}`,
    `Pengambilan: ${displayDate(state.startDate)}`,
    `Pengembalian: ${displayDate(state.endDate)}`,
    `Durasi: ${estimate.days} hari`,
    '',
    ...estimate.lines.map((line) => `• ${line.name} × ${line.quantity} — ${money(line.dailyPrice)}/unit/hari × ${estimate.days} hari = ${money(line.subtotal)}`),
    '',
    `Total estimasi sewa: ${money(estimate.total)}`,
    'Belum termasuk deposit, denda, atau biaya lain bila berlaku.',
    'Mohon konfirmasi stok, lokasi pengambilan, dan ketentuan sewa. Pengajuan ini belum merupakan reservasi.',
  ].join('\n');
}

export function buildWhatsAppUrl(number, state, contact) {
  if (!validBusinessNumber(number)) throw new Error('Nomor usaha belum tersedia.');
  const error = validateCheckout(state, contact);
  if (error) throw new Error(error.message);
  return `https://wa.me/${number}?text=${encodeURIComponent(buildMessage(state, contact))}`;
}
