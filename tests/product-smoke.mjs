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
await send('Runtime.enable'); await send('Network.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
async function go(path) {
 await send('Page.navigate',{url:'http://127.0.0.1:5500/'+path});
 for(let i=0;i<50;i++){ if(await evaluate('document.readyState === "complete"')) break; await pause(); }
 await pause();
}
await go('index.html');
await evaluate('localStorage.clear()');
assert.equal(await evaluate('document.querySelectorAll(".product-title-link").length'),10);
const ids=await evaluate('[...document.querySelectorAll(".product-title-link")].map(a=>new URL(a.href).searchParams.get("id"))');
for(const id of ids) {
 await go('produk.html?id='+id);
 assert.equal(await evaluate('document.getElementById("product-content").hidden'),false,id);
 assert.ok(await evaluate('document.getElementById("product-name").textContent.length>0'),id);
 assert.equal(await evaluate('document.querySelectorAll("#detail-specs > div").length'),3,id);
 assert.equal(await evaluate('document.querySelectorAll(".related-card").length'),3,id);
 assert.ok(await evaluate('document.getElementById("detail-image").complete && document.getElementById("detail-image").naturalWidth > 0'),id);
}
await go('produk.html?id=tenda-2p');
await input('detail-quantity','2'); await input('start-date','2096-11-10'); await input('end-date','2096-11-12');
assert.ok((await evaluate('document.getElementById("detail-total").textContent')).includes('200.000'));
await click('#product-rental-form button[type=submit]');
assert.equal(await evaluate('document.getElementById("cart-count").textContent'),'2');
await click('#rent-now'); await pause(); await pause();
assert.ok(await evaluate('location.pathname.endsWith("index.html") && location.hash === "#keranjang"'));
assert.equal(await evaluate('document.getElementById("cart-count").textContent'),'4');
assert.ok((await evaluate('document.getElementById("rental-total").textContent')).includes('400.000'));
await go('produk.html?id=tenda-2p');
await input('detail-quantity','0'); await click('#rent-now');
assert.equal(await evaluate('document.activeElement.id'),'detail-quantity');
await input('detail-quantity','99'); await click('#rent-now');
assert.ok((await evaluate('document.getElementById("detail-quantity-error").textContent')).includes('99'));
await input('detail-quantity','1'); await input('end-date','2096-11-10'); await click('#rent-now');
assert.equal(await evaluate('document.activeElement.id'),'end-date');
for(const width of [320,360,768,1280]) {
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false}); await pause();
 assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'overflow '+width);
}
await input('end-date','2096-11-12');
const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
await fs.writeFile('artifacts/product-desktop.png',Buffer.from(shot.data,'base64'));
await go('produk.html?id=unknown'); assert.equal(await evaluate('document.getElementById("product-not-found").hidden'),false);
await go('produk.html'); assert.equal(await evaluate('document.getElementById("product-not-found").hidden'),false);
assert.deepEqual(errors,[]);
console.log('PASS: all 10 product pages, links, images, specifications, recommendations, quantities, shared cart, dates, rent-now navigation, invalid IDs, 4 viewport widths; no JS/HTTP errors.');
await evaluate('localStorage.clear()'); socket.close();
