import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const tabs = await (await fetch('http://127.0.0.1:9222/json')).json();
const socket = new WebSocket(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
let counter = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const callback = pending.get(message.id);
    if (!callback) return;
    pending.delete(message.id);
    message.error ? callback.reject(message.error) : callback.resolve(message.result);
  }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) errors.push(message.params.response.url);
});
function send(method, params = {}) {
  const id = ++counter;
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
const pause = () => new Promise((resolve) => setTimeout(resolve, 200));
const input = (id, value) => evaluate(`(() => { const node = document.getElementById(${JSON.stringify(id)}); node.value = ${JSON.stringify(value)}; node.dispatchEvent(new Event('input', {bubbles:true})); })()`);
const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
await send('Runtime.enable');
await send('Network.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://127.0.0.1:5500' });
for (let i = 0; i < 50; i++) {
  if (await evaluate('document.querySelectorAll(".product-card").length === 10')) break;
  await pause();
}
assert.equal(await evaluate('document.querySelectorAll(".product-card").length'), 10);
await evaluate('localStorage.clear()');
await send('Page.reload');
await pause();
assert.equal(await evaluate('document.querySelectorAll(".product-card").length'), 10);
await fs.mkdir('artifacts', { recursive: true });
const desktop = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
await fs.writeFile('artifacts/desktop.png', Buffer.from(desktop.data, 'base64'));
await input('search', 'tenda');
await click('[data-category="carrier"]');
assert.equal(await evaluate('document.querySelectorAll(".product-card").length'), 0);
assert.equal(await evaluate('document.getElementById("no-results").hidden'), false);
await click('#reset-filters');
await click('[data-add="tenda-2p"]');
await click('[data-add="tenda-2p"]');
await click('[data-add="matras"]');
assert.equal(await evaluate('document.querySelectorAll(".cart-item").length'), 2);
assert.equal(await evaluate('document.getElementById("cart-count").textContent'), '3');
await input('start-date', '2096-11-10');
await input('end-date', '2096-11-12');
assert.ok((await evaluate('document.getElementById("rental-total").textContent')).includes('220.000'));
await click('#review-button');
assert.equal(await evaluate('document.activeElement.id'), 'customer-name');
await input('customer-name', '<Pendaki> & Rani');
await input('customer-phone', '081234567890');
await click('#review-button');
assert.equal(await evaluate('document.getElementById("review-panel").hidden'), false);
assert.equal(await evaluate('document.getElementById("whatsapp-button").disabled'), true);
assert.equal(await evaluate('document.querySelector("#review-contact dd").textContent'), '<Pendaki> & Rani');
await input('customer-name', 'Rani');
assert.equal(await evaluate('document.getElementById("review-panel").hidden'), true);
await click('#review-button');
await click('[data-action="plus"][data-id="matras"]');
assert.equal(await evaluate('document.getElementById("review-panel").hidden'), true);
assert.ok((await evaluate('document.getElementById("rental-total").textContent')).includes('240.000'));
await evaluate(`(() => { const node = document.querySelector('[data-quantity="matras"]'); node.value = '0'; node.dispatchEvent(new Event('input',{bubbles:true})); node.dispatchEvent(new Event('change',{bubbles:true})); })()`);
assert.equal(await evaluate('document.querySelector("[data-quantity=matras]").getAttribute("aria-invalid")'), 'true');
assert.equal(await evaluate('document.getElementById("review-button").disabled'), true);
await evaluate(`(() => { const node = document.querySelector('[data-quantity="matras"]'); node.value = '1'; node.dispatchEvent(new Event('input',{bubbles:true})); node.dispatchEvent(new Event('change',{bubbles:true})); })()`);
await send('Page.reload');
await pause();
assert.equal(await evaluate('document.getElementById("cart-count").textContent'), '3');
assert.equal(await evaluate('document.getElementById("customer-name").value'), '');
for (const width of [320, 360, 768, 1280]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
  assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), `Horizontal overflow at ${width}`);
}
await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 900, deviceScaleFactor: 1, mobile: true });
await evaluate('window.scrollTo(0,0)');
const mobile = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
await fs.writeFile('artifacts/mobile.png', Buffer.from(mobile.data, 'base64'));
await evaluate(`localStorage.setItem('puncak-rental:cart:v1', '{bad')`);
await send('Page.reload');
await pause();
assert.equal(await evaluate('document.getElementById("cart-count").textContent'), '0');
assert.equal(await evaluate('document.querySelectorAll(".product-card").length'), 10);
await evaluate('document.activeElement.blur()');
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
assert.equal(await evaluate('document.activeElement.className'), 'skip-link');
assert.deepEqual(errors, []);
console.log('PASS: catalogue, combined filters, cart, totals, contact validation, review invalidation, safe rendering, reload, corruption, 4 viewport widths, keyboard skip link; no runtime errors or failed HTTP assets.');
socket.close();
