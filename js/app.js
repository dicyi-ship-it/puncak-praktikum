import { BUSINESS } from './config.js';
import { CATEGORIES, PRODUCTS, filterProducts, findProduct } from './data.js';
import { displayDate, localToday, money, quote, removeItem, setQuantity, validQuantity, validateDates } from './cart.js';
import { loadState, saveState } from './storage.js';
import { buildWhatsAppUrl, normalizePhone, validBusinessNumber, validateCheckout } from './checkout.js';

const $ = (id) => document.getElementById(id);
const loaded = loadState();
let state = loaded.state;
let category = 'all';
let reviewed = false;
let toastTimer;
const businessReady = validBusinessNumber(BUSINESS.whatsapp);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function announce(message) {
  clearTimeout(toastTimer);
  const status = $('status-message');
  status.textContent = message;
  status.classList.add('visible');
  toastTimer = setTimeout(() => status.classList.remove('visible'), 4000);
}

function productImage(product, className = '') {
  const image = element('img', className);
  image.src = product.image;
  image.alt = product.imageAlt;
  image.width = 800;
  image.height = 533;
  image.loading = 'lazy';
  image.addEventListener('error', () => { image.src = 'assets/images/fallback.svg'; }, { once: true });
  return image;
}

function renderCatalog() {
  const products = filterProducts($('search').value, category);
  const fragment = document.createDocumentFragment();
  products.forEach((product) => {
    const card = element('article', 'product-card');
    const visual = element('a', 'product-image product-image-link');
    visual.href = `produk.html?id=${encodeURIComponent(product.id)}`;
    visual.setAttribute('aria-label', `Lihat detail ${product.name}`);
    visual.dataset.category = product.category;
    visual.append(productImage(product), element('span', 'product-tag', product.tag));
    const body = element('div', 'product-body');
    const title = element('h3');
    const titleLink = element('a', 'product-title-link', product.name);
    titleLink.href = `produk.html?id=${encodeURIComponent(product.id)}`;
    title.append(titleLink);
    body.append(
      element('p', 'product-category', CATEGORIES.find((entry) => entry.id === product.category).name),
      title,
      element('p', 'product-description', product.description),
      element('p', 'product-spec', product.specification),
    );
    const bottom = element('div', 'product-bottom');
    const price = element('div', 'product-price');
    price.append(element('strong', '', money(product.dailyPrice)), element('small', '', '/ unit / hari'));
    const add = element('button', 'add-button', '+ Tambah');
    add.type = 'button';
    add.dataset.add = product.id;
    add.setAttribute('aria-label', `Tambah ${product.name} ke keranjang`);
    bottom.append(price, add);
    const detailLink = element('a', 'product-detail-link', 'Lihat detail →');
    detailLink.href = `produk.html?id=${encodeURIComponent(product.id)}`;
    body.append(bottom, detailLink);
    card.append(visual, body);
    fragment.append(card);
  });
  $('product-grid').replaceChildren(fragment);
  $('result-count').textContent = `${products.length} dari ${PRODUCTS.length} perlengkapan`;
  $('no-results').hidden = products.length !== 0;
}

function renderFilters() {
  CATEGORIES.forEach((entry) => {
    const button = element('button', 'filter-button', entry.name);
    button.type = 'button';
    button.dataset.category = entry.id;
    button.setAttribute('aria-pressed', String(entry.id === category));
    $('category-filters').append(button);
  });
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach((node) => { node.textContent = ''; });
  document.querySelectorAll('[aria-invalid]').forEach((node) => node.removeAttribute('aria-invalid'));
}

function invalidateReview() {
  reviewed = false;
  $('review-panel').hidden = true;
  $('whatsapp-button').disabled = true;
  clearErrors();
}

function persist() {
  if (!saveState(state)) $('storage-warning').hidden = false;
}

function updateEstimate() {
  const estimate = quote(state);
  const dateError = validateDates(state.startDate, state.endDate);
  const hasValidDates = !dateError;
  $('cart-count').textContent = estimate.units;
  $('rental-duration').textContent = hasValidDates ? `${estimate.days} hari` : 'Belum valid';
  if (!state.startDate && !state.endDate) $('rental-duration').textContent = 'Belum dipilih';
  $('rental-total').textContent = hasValidDates ? money(estimate.total) : '—';
  $('estimate-help').textContent = hasValidDates ? `${estimate.units} unit alat × ${estimate.days} hari. Stok perlu dikonfirmasi.` : 'Pilih tanggal yang valid untuk menghitung biaya.';
  $('review-button').disabled = state.items.length === 0;
  document.querySelectorAll('[data-subtotal]').forEach((node) => {
    const line = estimate.lines.find((entry) => entry.id === node.dataset.subtotal);
    node.textContent = hasValidDates ? `Subtotal ${estimate.days} hari: ${money(line.subtotal)}` : 'Pilih tanggal untuk melihat subtotal.';
  });
}

function renderCart(focusTarget) {
  const fragment = document.createDocumentFragment();
  state.items.forEach((item) => {
    const product = findProduct(item.productId);
    const row = element('div', 'cart-item');
    const head = element('div', 'cart-item-head');
    const details = element('div');
    details.append(element('h3', '', product.name), element('p', 'item-rate', `${money(product.dailyPrice)} / unit / hari`));
    const image = productImage(product, 'cart-thumb');
    image.alt = '';
    head.append(image, details);
    const controls = element('div', 'cart-item-controls');
    const quantity = element('div', 'quantity-control');
    for (const [action, text, label] of [['minus', '−', 'Kurangi'], ['plus', '+', 'Tambah']]) {
      const button = element('button', '', text);
      button.type = 'button';
      button.dataset.action = action;
      button.dataset.id = product.id;
      button.setAttribute('aria-label', `${label} jumlah ${product.name}`);
      button.disabled = action === 'minus' ? item.quantity <= 1 : item.quantity >= 99;
      quantity.append(button);
    }
    const input = element('input');
    input.type = 'number';
    input.inputMode = 'numeric';
    input.min = '1';
    input.max = '99';
    input.step = '1';
    input.value = item.quantity;
    input.dataset.quantity = product.id;
    input.setAttribute('aria-label', `Jumlah ${product.name}`);
    quantity.insertBefore(input, quantity.lastChild);
    const remove = element('button', 'remove-button', 'Hapus');
    remove.type = 'button';
    remove.dataset.action = 'remove';
    remove.dataset.id = product.id;
    remove.setAttribute('aria-label', `Hapus ${product.name} dari keranjang`);
    controls.append(quantity, remove);
    const error = element('p', 'field-error');
    error.id = `quantity-error-${product.id}`;
    input.setAttribute('aria-describedby', error.id);
    const subtotal = element('p', 'line-subtotal');
    subtotal.dataset.subtotal = product.id;
    row.append(head, controls, error, subtotal);
    fragment.append(row);
  });
  $('cart-items').replaceChildren(fragment);
  $('cart-empty').hidden = state.items.length > 0;
  updateEstimate();
  if (focusTarget) {
    const selector = focusTarget.action ? `[data-action="${focusTarget.action}"][data-id="${focusTarget.id}"]` : `[data-quantity="${focusTarget.id}"]`;
    const target = $('cart-items').querySelector(selector);
    if (target && !target.disabled) target.focus({ preventScroll: true });
    else ($('cart-items').querySelector(`[data-quantity="${focusTarget.id}"]`) || $('cart-heading')).focus({ preventScroll: true });
  }
}

function changeQuantity(id, quantity, focusTarget) {
  try {
    const next = setQuantity(state.items, id, quantity);
    invalidateReview();
    state.items = next;
    persist();
    renderCart(focusTarget);
    return true;
  } catch (error) {
    announce(error.message);
    return false;
  }
}

function contact() {
  return { name: $('customer-name').value, phone: $('customer-phone').value };
}

function showError(error) {
  clearErrors();
  const input = $(error.field);
  const errorNode = $(`${error.field}-error`) || $('form-error');
  errorNode.textContent = error.message;
  input.setAttribute('aria-invalid', 'true');
  input.focus();
}

function renderReview() {
  const estimate = quote(state);
  const data = contact();
  const description = document.createDocumentFragment();
  [['Nama', data.name.trim()], ['WhatsApp', normalizePhone(data.phone)]].forEach(([label, value]) => {
    description.append(element('dt', '', label), element('dd', '', value));
  });
  $('review-contact').replaceChildren(description);
  $('review-lines').replaceChildren(...estimate.lines.map((line) => element('li', '', `${line.name} × ${line.quantity} — ${money(line.dailyPrice)}/hari × ${estimate.days} hari = ${money(line.subtotal)}`)));
  $('review-dates').textContent = `${displayDate(state.startDate)} → ${displayDate(state.endDate)} · ${estimate.days} hari`;
  $('review-total').textContent = `Total estimasi: ${money(estimate.total)}`;
  reviewed = true;
  $('review-panel').hidden = false;
  $('whatsapp-button').disabled = !businessReady;
  $('review-heading').focus();
}

renderFilters();
$('search').value = new URLSearchParams(window.location.search).get('q') || '';
renderCatalog();
$('start-date').min = localToday();
$('end-date').min = state.startDate || localToday();
$('start-date').value = state.startDate;
$('end-date').value = state.endDate;
renderCart();
$('storage-warning').hidden = !loaded.failed;
$('year').textContent = new Date().getFullYear();
$('unavailable-note').hidden = businessReady;

const contactLines = [];
if (BUSINESS.address) {
  contactLines.push(`${BUSINESS.addressIsExample ? 'Alamat contoh' : 'Alamat'}: ${BUSINESS.address}`);
  $('footer-address').textContent = BUSINESS.address;
  $('footer-address-note').hidden = !BUSINESS.addressIsExample;
  $('footer-address-note').textContent = 'Alamat contoh untuk demonstrasi website.';
}
if (BUSINESS.openingHours) contactLines.push(`Jam buka: ${BUSINESS.openingHours}`);
if (businessReady) contactLines.push(`WhatsApp: +${BUSINESS.whatsapp}`);
if (contactLines.length) $('business-contact').textContent = contactLines.join(' · ');

$('search').addEventListener('input', renderCatalog);
$('category-filters').addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  category = button.dataset.category;
  $('category-filters').querySelectorAll('button').forEach((node) => node.setAttribute('aria-pressed', String(node === button)));
  renderCatalog();
});
$('reset-filters').addEventListener('click', () => {
  $('search').value = '';
  category = 'all';
  $('category-filters').querySelectorAll('button').forEach((node) => node.setAttribute('aria-pressed', String(node.dataset.category === category)));
  renderCatalog();
  $('search').focus();
});
$('product-grid').addEventListener('click', (event) => {
  const button = event.target.closest('[data-add]');
  if (!button) return;
  const id = button.dataset.add;
  const current = state.items.find((item) => item.productId === id)?.quantity || 0;
  if (changeQuantity(id, current + 1)) announce(`${findProduct(id).name} ditambahkan ke keranjang.`);
});
$('cart-items').addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { id, action } = button.dataset;
  if (action === 'remove') {
    invalidateReview();
    state.items = removeItem(state.items, id);
    persist();
    renderCart();
    const remaining = $('cart-items').querySelector('button');
    (remaining || $('cart-heading')).focus({ preventScroll: true });
    announce(`${findProduct(id).name} dihapus dari keranjang.`);
    return;
  }
  const current = state.items.find((item) => item.productId === id).quantity;
  changeQuantity(id, current + (action === 'plus' ? 1 : -1), { id, action });
});
$('cart-items').addEventListener('input', (event) => {
  if (!event.target.matches('[data-quantity]')) return;
  invalidateReview();
  // A partially typed quantity must never leave an old review available.
  $('review-button').disabled = true;
});
$('cart-items').addEventListener('change', (event) => {
  const input = event.target;
  if (!input.matches('[data-quantity]')) return;
  const id = input.dataset.quantity;
  if (!changeQuantity(id, input.valueAsNumber, { id })) {
    input.setAttribute('aria-invalid', 'true');
    $(`quantity-error-${id}`).textContent = 'Sebelumnya tetap dipakai. Masukkan jumlah bulat 1–99.';
    $('review-button').disabled = true;
    input.focus();
  }
});
for (const id of ['start-date', 'end-date']) {
  $(id).addEventListener('input', () => {
    invalidateReview();
    state.startDate = $('start-date').value;
    state.endDate = $('end-date').value;
    $('start-date').min = localToday();
    $('end-date').min = state.startDate || localToday();
    persist();
    updateEstimate();
    if (state.startDate && state.endDate) {
      const error = validateDates(state.startDate, state.endDate);
      if (error) {
        $(error.field).setAttribute('aria-invalid', 'true');
        $(`${error.field}-error`).textContent = error.message;
      }
    }
  });
}
for (const id of ['customer-name', 'customer-phone']) $(id).addEventListener('input', invalidateReview);
$('rental-form').addEventListener('submit', (event) => {
  event.preventDefault();
  for (const input of $('cart-items').querySelectorAll('[data-quantity]')) {
    if (!validQuantity(input.valueAsNumber)) {
      input.setAttribute('aria-invalid', 'true');
      $(`quantity-error-${input.dataset.quantity}`).textContent = 'Masukkan jumlah bulat 1–99.';
      input.focus();
      return;
    }
    state.items = setQuantity(state.items, input.dataset.quantity, input.valueAsNumber);
  }
  persist();
  updateEstimate();
  const error = validateCheckout(state, contact());
  if (error) { showError(error); return; }
  clearErrors();
  renderReview();
});
$('edit-request').addEventListener('click', () => {
  invalidateReview();
  $('start-date').focus();
});
$('whatsapp-button').addEventListener('click', () => {
  if (!reviewed || !businessReady) return;
  const error = validateCheckout(state, contact());
  if (error) { invalidateReview(); showError(error); return; }
  // Same-tab navigation avoids popup blockers and leaves the browser back action available.
  window.location.assign(buildWhatsAppUrl(BUSINESS.whatsapp, state, contact()));
});

// Restore cart after returning from a detail page through the browser back cache.
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  state = loadState().state;
  invalidateReview();
  $('start-date').value = state.startDate;
  $('end-date').value = state.endDate;
  renderCart();
});
