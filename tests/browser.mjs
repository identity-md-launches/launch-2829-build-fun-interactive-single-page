import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { hexToString } from 'viem';

// This test uses synthetic, explicitly isolated API responses and an ephemeral
// EIP-6963 test provider. No key, wallet, fixture result or test account is in dist/.
const coreAddress = '0x980b4424c007caf7a1f3670b48c8eaef7ebc3d44';
const streamId = '0x52e443e4e0d236ff0c07f4cdc518c594a3d680d20abb1481510efbed0ec73633';
const root = resolve('dist');
const out = resolve('test/scratch/browser');
await mkdir(out, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/preview\//, '');
  const file = resolve(root, path || 'index.html');
  if (!file.startsWith(root + '/') && file !== root) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }); res.end(await readFile(file)); }
  catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
const results = [];
const record = (name, detail = '') => { results.push({ name, passed: true, detail }); console.log(`PASS ${name}${detail ? `: ${detail}` : ''}`); };
const browser = await chromium.launch({ headless: true });
const errors = [], localFailures = [], consoleErrors = [];

function fixture(frontier = 100, outcomeWork = '0') {
  const transactionHash = id => `0x${id.toString(16).padStart(64, 'a')}`;
  const chain = { chainId: '11155111', target: 'sepolia', confirmations: '12', safeThroughBlock: '12000000' };
  return {
    core: { schemaVersion: 1, status: 'available', chain, identities: { core: coreAddress }, configuration: { streamId, genesisTimestamp: '1793022600', roundDuration: '600' }, core: { settledThroughRound: String(frontier), paused: false }, events: [] },
    events: { schemaVersion: 3, status: 'available', chain, identities: { core: coreAddress }, nextCursor: null, events: Array.from({ length: frontier - 91 }, (_, i) => {
      const id = frontier - i, work = id > 100 ? outcomeWork : '0';
      return { type: 'system.settlement_completed', eventVersion: 2, occurredAt: '2026-11-01T14:00:00.000Z', source: { kind: 'chain', confirmationStatus: 'safe', chainId: '11155111', contractAddress: coreAddress, transactionHash: transactionHash(id) }, payload: { previousSettledThroughRound: String(id - 1), settledThroughRound: String(id), activeRoundCount: work === '0' ? '0' : '1', workAdded: work } };
    }) },
  };
}
async function mockApi(context, state) {
  await context.route('https://api.squeekchain.com/**', async route => {
    if (state.unavailable) return route.fulfill({ status: 200, json: { schemaVersion: 1, status: 'unavailable', reason: 'indexer_unavailable' } });
    if (state.blocked) return route.abort('failed');
    const data = fixture(state.frontier ?? 100, state.work ?? '0');
    return route.fulfill({ json: route.request().url().includes('/v1/core') ? data.core : data.events });
  });
}
async function expectText(page, text) { await page.getByText(text, { exact: true }).first().waitFor({ state: 'visible' }); }
async function openAndPlant(page, name = 'daisy') {
  await page.getByRole('button', { name: 'Plant a seed', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  if (name !== 'daisy') await page.getByRole('button', { name: new RegExp(`^${name}`, 'i') }).last().click();
  await page.getByRole('button', { name: `Plant ${name}`, exact: true }).click();
}

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const state = { frontier: 100 };
  await mockApi(context, state);
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('response', r => { if (r.url().startsWith(url) && r.status() >= 400) localFailures.push(`${r.status()} ${r.url()}`); });
  await page.goto(url);
  await expectText(page, 'Following settled rounds');
  const action = await page.getByRole('button', { name: 'Plant a seed', exact: true }).boundingBox();
  assert.ok(action && action.y + action.height <= 844, 'Main action is on the first mobile screen');
  assert.ok(await page.locator('.garden-scene').isVisible());
  record('390 first screen', `Plant action bottom ${Math.round(action.y + action.height)}px`);
  for (const width of [320, 390, 590, 810, 1130, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, `Overflow at ${width}`);
  }
  record('Responsive reflow', '320, 390, 590, 810, 1130, 1440');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const enlargement = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, elements: [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 && r.width > 0; }).slice(0, 8).map(e => `${e.tagName}.${e.className}`) }));
  assert.ok(enlargement.overflow <= 0, `200% text overflow: ${JSON.stringify(enlargement)}`);
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  record('200% text enlargement', 'No horizontal overflow at 390; separate from native browser zoom');
  await page.getByRole('button', { name: 'Connect', exact: true }).click();
  await expectText(page, 'Browser wallet');
  await expectText(page, 'Coinbase Wallet');
  await page.getByRole('button', { name: 'Browser wallet', exact: true }).click();
  await expectText(page, 'Wallet connection was not completed. Open your wallet and try again.');
  await page.keyboard.press('Escape');
  assert.ok(await page.getByRole('button', { name: 'Connect', exact: true }).evaluate(e => e === document.activeElement));
  record('Wallet picker and recovery', 'No-extension error, Coinbase row, Escape and focus return');
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await openAndPlant(page);
  await page.getByRole('button', { name: 'Plot 1: Daisy, 0 of 12 growth', exact: true }).waitFor();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Play a practice round', exact: true }).click();
  await page.getByRole('button', { name: 'Plot 1: Daisy, ready to harvest', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Harvest 1 plant', exact: true }).click();
  await expectText(page, 'A lovely harvest! +3 petals in your basket.');
  assert.deepEqual(await page.locator('.basket-stats strong').allTextContents(), ['4', '1']);
  record('Practice lifecycle', 'Plant, Jog +3, Nap +1, Zoomies +6/+1 petal, Jog +3, harvest +3 petals');
  await page.reload();
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  assert.deepEqual(await page.locator('.basket-stats strong').allTextContents(), ['4', '1']);
  await openAndPlant(page, 'carrot');
  await page.getByRole('button', { name: 'Plot 1: Carrot, 0 of 16 growth', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Live garden', exact: true }).click();
  assert.equal(await page.locator('.plot.planted').count(), 0);
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  assert.equal(await page.locator('.plot.planted').count(), 1);
  record('Local persistence and mode isolation', 'Reload retains harvest points and plants, live stays separate');
  await page.getByRole('button', { name: 'Plot 1: Carrot, 0 of 16 growth', exact: true }).click();
  assert.equal(await page.getByRole('progressbar').getAttribute('value'), '0');
  await page.getByRole('button', { name: 'Back to garden', exact: true }).click();
  await page.getByRole('button', { name: 'How it grows', exact: true }).click();
  assert.ok(await page.getByRole('dialog').isVisible());
  for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); assert.ok(await page.evaluate(() => !!document.activeElement?.closest('dialog'))); }
  await page.keyboard.press('Escape');
  record('Plant detail and keyboard dialogs', 'Native progress, modal focus trap, Escape');
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  assert.equal(audit.violations.length, 0, JSON.stringify(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))));
  record('Axe WCAG automated audit', `${audit.passes.length} passing rules; 0 violations in practice state`);
  await page.getByRole('button', { name: 'Live garden', exact: true }).click();
  state.unavailable = true;
  await page.getByRole('button', { name: 'Refresh settled rounds', exact: true }).click();
  await expectText(page, 'Connection paused');
  await expectText(page, 'Settled rounds are unavailable. Retry in a moment.');
  state.unavailable = false;
  await page.getByRole('button', { name: 'Retry connection', exact: true }).click();
  await expectText(page, 'Following settled rounds');
  record('API unavailable and retry', 'Retains last confirmed data; recovery resumes reads');
  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' });
  await mockApi(mobile, {});
  const phone = await mobile.newPage();
  await phone.goto(url);
  await phone.getByRole('button', { name: 'Connect', exact: true }).click();
  for (const name of ['MetaMask', 'Coinbase Wallet', 'Rabby', 'Phantom']) {
    const link = phone.getByRole('link', { name: `Open in ${name}`, exact: true });
    assert.ok((await link.getAttribute('href')).includes(encodeURIComponent(url)) || name === 'MetaMask' && (await link.getAttribute('href')).includes(url.replace(/^http:\/\//, '')));
  }
  await expectText(phone, 'Coinbase Smart Wallet');
  assert.equal(await phone.getByRole('button', { name: 'Browser wallet', exact: true }).count(), 0);
  record('Phone wallet sheet', 'Four encoded open-in links and Coinbase Smart Wallet; no QR relay');
  await mobile.close();

  const walletContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const live = { frontier: 100, work: '0' };
  await mockApi(walletContext, live);
  const account = privateKeyToAccount(generatePrivateKey());
  const signed = [];
  const wallet = await walletContext.newPage();
  wallet.on('pageerror', e => errors.push(e.message));
  wallet.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await wallet.exposeFunction('__signTestMessage', async data => { const message = hexToString(data); signed.push(message); return account.signMessage({ message }); });
  await wallet.addInitScript(({ address }) => {
    let chain = '0xaa36a7';
    let authorized = localStorage.getItem('test-wallet-connected') === 'yes';
    const listeners = new Map();
    const requests = [];
    const provider = {
      on(event, callback) { const all = listeners.get(event) || new Set(); all.add(callback); listeners.set(event, all); },
      removeListener(event, callback) { listeners.get(event)?.delete(callback); },
      emit(event, value) { listeners.get(event)?.forEach(fn => fn(value)); },
      setChain(value) { chain = value; provider.emit('chainChanged', value); },
      async request({ method, params }) {
        requests.push(method);
        if (method === 'eth_requestAccounts') { authorized = true; localStorage.setItem('test-wallet-connected', 'yes'); return [address]; }
        if (method === 'eth_accounts') return authorized ? [address] : [];
        if (method === 'eth_chainId') return chain;
        if (method === 'wallet_requestPermissions') return [{ parentCapability: 'eth_accounts' }];
        if (method === 'wallet_revokePermissions') { authorized = false; localStorage.removeItem('test-wallet-connected'); return null; }
        if (method === 'wallet_switchEthereumChain') { if (window.__switchUnknown) { window.__switchUnknown = false; throw Object.assign(new Error('Unknown chain'), { code: 4902 }); } provider.setChain(params[0].chainId); return null; }
        if (method === 'wallet_addEthereumChain') { provider.setChain(params[0].chainId); return null; }
        if (method === 'personal_sign') { if (window.__rejectSignature) { window.__rejectSignature = false; throw Object.assign(new Error('User rejected'), { code: 4001 }); } return window.__signTestMessage(params[0]); }
        throw new Error(`Unexpected test-wallet method: ${method}`);
      },
    };
    window.ethereum = provider;
    window.__testProvider = provider;
    window.__testRequests = requests;
    const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: { info: { uuid: '68c550ac-2de0-4d33-905d-e082ec065f22', name: 'Garden Test Wallet', rdns: 'test.garden.wallet', icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><rect width="28" height="28" fill="green"/></svg>' }, provider } }));
    window.addEventListener('eip6963:requestProvider', announce);
    announce();
  }, { address: account.address });
  await wallet.goto(url);
  await expectText(wallet, 'Following settled rounds');
  await wallet.getByRole('button', { name: 'Connect', exact: true }).click();
  await expectText(wallet, 'Garden Test Wallet');
  assert.equal(await wallet.getByRole('button', { name: 'Browser wallet', exact: true }).count(), 0);
  await wallet.getByRole('button', { name: 'Garden Test Wallet', exact: true }).click();
  await wallet.getByRole('dialog').waitFor({ state: 'hidden' });
  record('EIP-6963 connection', 'Named provider with icon; generic row hidden');
  await wallet.evaluate(() => { window.__switchUnknown = true; window.__testProvider.setChain('0x1'); });
  await wallet.getByRole('button', { name: 'Switch to Sepolia', exact: true }).click();
  await wallet.getByRole('button', { name: 'Switch to Sepolia', exact: true }).waitFor({ state: 'hidden' });
  assert.ok(await wallet.evaluate(() => window.__testRequests.includes('wallet_addEthereumChain')));
  record('Wrong network recovery', 'wallet_switchEthereumChain with 4902 add-chain fallback');
  await wallet.getByRole('button', { name: 'Plant a seed', exact: true }).click();
  await wallet.evaluate(() => { window.__rejectSignature = true; });
  await wallet.getByRole('button', { name: 'Plant daisy', exact: true }).click();
  await expectText(wallet, 'Planting was not signed. Open your wallet and try again.');
  assert.equal(await wallet.locator('.plot.planted').count(), 0);
  await wallet.getByRole('button', { name: 'Plant daisy', exact: true }).click();
  await wallet.getByRole('button', { name: 'Plot 1: Daisy, 0 of 12 growth', exact: true }).waitFor();
  assert.equal(signed.length, 1);
  assert.ok(signed[0].includes('Chain: Ethereum Sepolia (11155111)'));
  assert.ok(signed[0].includes('Start after settled round: 100'));
  assert.ok(signed[0].includes('It does not send a transaction'));
  record('Signed live planting and rejection recovery', 'Real ephemeral EOA signature verified; declined signature plants nothing');
  live.frontier = 101; live.work = '500';
  await wallet.getByRole('button', { name: 'Refresh settled rounds', exact: true }).click();
  await wallet.getByRole('button', { name: 'Plot 1: Daisy, 6 of 12 growth', exact: true }).waitFor();
  await wallet.getByRole('button', { name: 'Refresh settled rounds', exact: true }).click();
  await expectText(wallet, 'Following settled rounds');
  assert.equal(await wallet.getByRole('button', { name: 'Plot 1: Daisy, 6 of 12 growth', exact: true }).count(), 1);
  live.frontier = 102;
  await wallet.getByRole('button', { name: 'Refresh settled rounds', exact: true }).click();
  await wallet.getByRole('button', { name: 'Plot 1: Daisy, ready to harvest', exact: true }).click();
  await wallet.getByRole('button', { name: 'Harvest daisy · +3 petals', exact: true }).click();
  assert.deepEqual(await wallet.locator('.basket-stats strong').allTextContents(), ['5', '1']);
  record('Live settled-round lifecycle', 'Two confirmed Zoomies rounds, deduplicated poll, detail harvest and correct +5 total petals');
  await wallet.reload();
  await expectText(wallet, 'Following settled rounds');
  await wallet.locator('.button-wallet').filter({ hasText: '…' }).waitFor();
  assert.deepEqual(await wallet.locator('.basket-stats strong').allTextContents(), ['5', '1']);
  record('Wallet reconnect and account save', 'Connection and local garden restored on reload');
  await wallet.locator('.button-wallet').click();
  await wallet.getByRole('button', { name: 'Disconnect', exact: true }).click();
  await wallet.getByRole('button', { name: 'Connect', exact: true }).waitFor();
  assert.deepEqual(await wallet.locator('.basket-stats strong').allTextContents(), ['0', '0']);
  record('Disconnect isolation', 'Disconnected view reveals no other wallet garden');
  await walletContext.close();
  assert.equal(errors.length, 0, JSON.stringify(errors));
  assert.equal(localFailures.length, 0, JSON.stringify(localFailures));
  assert.equal(consoleErrors.length, 0, JSON.stringify(consoleErrors));
  record('Production static subpath and console', 'No missing local files, console errors or page errors');
} catch (error) {
  results.push({ name: 'Validation interrupted', passed: false, detail: error.message });
  for (const context of browser.contexts()) for (const page of context.pages()) await page.screenshot({ path: `${out}/failure-${Date.now()}.png`, fullPage: true }).catch(() => {});
  throw error;
} finally {
  await writeFile(`${out}/results.json`, JSON.stringify({ url: '/preview/', results, errors, consoleErrors, localFailures }, null, 2));
  await browser.close();
  await new Promise(r => server.close(r));
}
