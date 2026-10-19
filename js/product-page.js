import { BUSINESS } from './config.js';
import { CATEGORIES, PRODUCTS, findProduct } from './data.js';
import { PRODUCT_DETAILS } from './product-details.js';
import { localToday, money, quote, rentalDays, setQuantity, validQuantity, validateDates } from './cart.js';
import { loadState, saveState } from './storage.js';

const $ = (id) => document.getElementById(id);
const product = findProduct(new URLSearchParams(window.location.search).get('id'));
const initial = loadState();
let state = initial.state;

function node(tag, className, text) {
  const value = document.createElement(tag);
  if (className) value.className = className;
  if (text !== undefined) value.textContent = text;
  return value;
}

function updateCount() {
  $('cart-count').textContent = quote(state).units;
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach((item) => { item.textContent = ''; });
  document.querySelectorAll('[aria-invalid]').forEach((item) => item.removeAttribute('aria-invalid'));
  $('detail-feedback').textContent = '';
}

function showError(field, message) {
  const input = $(field);
  input.setAttribute('aria-invalid', 'true');
  $(`${field}-error`).textContent = message;
  input.focus();
}

function updateEstimate() {
  clearErrors();
  const quantity = $('detail-quantity').valueAsNumber;
  const start = $('start-date').value;
  const end = $('end-date').value;
  $('start-date').min = localToday();
  $('end-date').min = start || localToday();
  $('quantity-minus').disabled = validQuantity(quantity) && quantity === 1;
  $('quantity-plus').disabled = validQuantity(quantity) && quantity === 99;
  const valid = validQuantity(quantity) && !validateDates(start, end);
  const days = rentalDays(start, end);
  const dailyPreview = validQuantity(quantity) && !start && !end;
  $('detail-duration').textContent = valid ? `${quantity} unit × ${days} hari` : dailyPreview ? `Subtotal ${quantity} unit / hari` : 'Estimasi biaya produk';
  $('detail-total').textContent = valid ? money(product.dailyPrice * quantity * days) : dailyPreview ? money(product.dailyPrice * quantity) : 'Periksa jumlah & tanggal';
  $('detail-total').classList.toggle('incomplete', !valid && !dailyPreview);
}

function addToCart(goToCart) {
  clearErrors();
  const quantity = $('detail-quantity').valueAsNumber;
  if (!validQuantity(quantity)) { showError('detail-quantity', 'Masukkan jumlah bulat antara 1 dan 99.'); return; }
  const start = $('start-date').value;
  const end = $('end-date').value;
  if (start || end) {
    const error = validateDates(start, end);
    if (error) { showError(error.field, error.message); return; }
  }
  // Read the latest cart so additions made in another page are preserved.
  const latest = loadState();
  const next = latest.failed ? state : latest.state;
  const previous = next.items.find((item) => item.productId === product.id)?.quantity || 0;
  if (!validQuantity(previous + quantity)) {
    showError('detail-quantity', `Sudah ada ${previous} unit di keranjang. Total maksimum 99 unit untuk produk ini.`);
    return;
  }
  next.items = setQuantity(next.items, product.id, previous + quantity);
  if (start && end) { next.startDate = start; next.endDate = end; }
  if (!saveState(next)) {
    $('storage-warning').hidden = false;
    $('detail-action-error').textContent = 'Produk belum dapat disimpan ke keranjang. Izinkan penyimpanan browser atau tambahkan produk langsung dari katalog.';
    return;
  }
  state = next;
  updateCount();
  $('detail-feedback').textContent = `${quantity} unit ${product.name} ditambahkan. Total produk ini di keranjang: ${previous + quantity} unit.`;
  if (goToCart) window.location.assign('index.html#keranjang');
}

function relatedCard(item) {
  const link = node('a', 'related-card');
  link.href = `produk.html?id=${encodeURIComponent(item.id)}`;
  const image = node('img');
  image.src = item.image;
  image.alt = item.imageAlt;
  image.width = 800;
  image.height = 533;
  image.loading = 'lazy';
  image.addEventListener('error', () => { image.src = 'assets/images/fallback.svg'; }, { once: true });
  const content = node('div');
  content.append(node('p', 'product-category', CATEGORIES.find((category) => category.id === item.category).name), node('h3', '', item.name), node('strong', '', money(item.dailyPrice)), node('small', '', ' / unit / hari'), node('span', 'text-link', 'Lihat detail →'));
  link.append(image, content);
  return link;
}

updateCount();
$('year').textContent = new Date().getFullYear();
if (BUSINESS.address) {
  $('footer-address').textContent = BUSINESS.address;
  $('footer-address-note').hidden = !BUSINESS.addressIsExample;
}
$('storage-warning').hidden = !initial.failed;

if (!product) {
  $('product-not-found').hidden = false;
  $('breadcrumb-product').textContent = 'Produk tidak ditemukan';
  document.title = 'Produk tidak ditemukan — Puncak Rental';
} else {
  const details = PRODUCT_DETAILS[product.id];
  document.title = `${product.name} — Sewa di Puncak Rental`;
  document.querySelector('meta[name="description"]').content = `${product.description} Sewa mulai ${money(product.dailyPrice)} per unit per hari. Periksa spesifikasi dan ajukan kebutuhanmu.`;
  $('breadcrumb-product').textContent = product.name;
  $('product-name').textContent = product.name;
  $('detail-category').textContent = CATEGORIES.find((category) => category.id === product.category).name;
  $('detail-description').textContent = product.description;
  $('detail-price').textContent = money(product.dailyPrice);
  $('detail-image').src = product.image;
  $('detail-image').alt = product.imageAlt;
  $('zoom-product-image').src = product.image;
  $('zoom-product-image').alt = product.imageAlt;
  $('open-product-image').addEventListener('click', () => $('product-image-dialog').showModal());
  $('close-product-image').addEventListener('click', () => $('product-image-dialog').close());
  $('product-image-dialog').addEventListener('click', (event) => {
    if (event.target === $('product-image-dialog')) $('product-image-dialog').close();
  });

  $('detail-image').addEventListener('error', () => { $('detail-image').src = 'assets/images/fallback.svg'; }, { once: true });
  $('detail-overview').textContent = details.overview;
  $('detail-notes').replaceChildren(...details.notes.map((text) => node('li', '', text)));
  details.specs.forEach(([label, value]) => {
    const row = node('div');
    row.append(node('dt', '', label), node('dd', '', value));
    $('detail-specs').append(row);
  });
  const others = PRODUCTS.filter((item) => item.id !== product.id).sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category)).slice(0, 3);
  $('related-products').replaceChildren(...others.map(relatedCard));
  $('start-date').value = state.startDate;
  $('end-date').value = state.endDate;
  $('product-content').hidden = false;
  updateEstimate();
  for (const id of ['detail-quantity', 'start-date', 'end-date']) $(id).addEventListener('input', updateEstimate);
  for (const [id, delta] of [['quantity-minus', -1], ['quantity-plus', 1]]) {
    $(id).addEventListener('click', () => {
      const current = $('detail-quantity').valueAsNumber;
      const value = current + delta;
      if (!validQuantity(value)) { showError('detail-quantity', 'Masukkan jumlah bulat antara 1 dan 99.'); return; }
      $('detail-quantity').value = value;
      updateEstimate();
    });
  }
  $('product-rental-form').addEventListener('submit', (event) => { event.preventDefault(); addToCart(false); });
  $('rent-now').addEventListener('click', () => addToCart(true));
}
window.addEventListener('pageshow', (event) => {
  if (event.persisted) { state = loadState().state; updateCount(); }
});
