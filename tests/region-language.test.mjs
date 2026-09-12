import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { startRegionLanguage } from '../src/region-language.ts';
const source = `this.start = ${startRegionLanguage.toString()};`;
function fixture(options = {}) {
  const { href = 'https://example.test/', saved, blocked = false, bad = false, ok = true, wait = false } = options;
  const country = Object.hasOwn(options, 'country') ? options.country : 'US';
  let resolve;
  const pending = new Promise(r => { resolve = r; });
  const values = [], requests = [], writes = [], listeners = new Map();
  class Element {
    constructor(tagName, attrs) { this.tagName = tagName; this.attrs = attrs; }
    closest() { return this; }
    getAttribute(k) { return this.attrs[k] ?? null; }
    setAttribute(k, v) { this.attrs[k] = v; }
  }
  const document = {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  };
  const window = { location: { href }, document,
    localStorage: {
      getItem(k) { if (blocked) throw Error('disabled'); return k === 'yuxino:site-language:manual:v1' ? saved ?? null : 'zh'; },
      setItem(k, v) { if (blocked) throw Error('disabled'); writes.push([k, v]); },
    },
    fetch: (...args) => {
      requests.push(args);
      if (wait) return pending;
      return Promise.resolve({ ok, json: async () => { if (bad) throw Error('invalid'); return { country }; } });
    },
  };
  Object.defineProperty(window, 'navigator', { get() { throw Error('Must not inspect browser language or location'); } });
  const context = vm.createContext({ window, URL, Element, AbortController, setTimeout, clearTimeout });
  vm.runInContext(source, context);
  const controller = context.start((value) => values.push(value));
  return { values, requests, writes, controller, Element, listeners, resolve };
}
const flush = () => new Promise(r => setTimeout(r, 5));
for (const country of ['CN', 'HK', 'MO', 'TW']) test(`verified ${country} selects Chinese only after lookup`, async () => {
  const f = fixture({ country }); assert.deepEqual(f.values, ['en']); await flush();
  assert.deepEqual(f.values, ['en', 'zh']); assert.equal(f.writes.length, 0); f.controller.dispose();
});
for (const country of ['US', 'JP', 'KR', 'SG', 'MY', undefined, null, '', 'China', 'zh-CN', 'cn', 123, {}, 'ZZ']) test(`unconfirmed/non-Chinese ${JSON.stringify(country)} stays English`, async () => {
  const f = fixture({ country }); await flush(); assert.deepEqual(f.values, ['en']); f.controller.dispose();
});
for (const opts of [{ ok: false, country: 'CN' }, { bad: true }, { blocked: true, country: 'US' }]) test(`error/blocked storage ${JSON.stringify(opts)} stays English`, async () => {
  const f = fixture(opts); await flush(); assert.deepEqual(f.values, ['en']); f.controller.dispose();
});
for (const [href, expected] of [['https://example.test/?lang=zh', 'zh'], ['https://example.test/?lang=en', 'en'], ['https://example.test/en/', 'en'], ['https://example.test/zh/', 'zh'], ['https://example.test/en.html', 'en'], ['https://example.test/zh.html', 'zh']]) test(`explicit ${href}`, async () => {
  const f = fixture({ href }); await flush(); assert.deepEqual(f.values, [expected]); assert.equal(f.requests.length, 0); f.controller.dispose();
});
for (const saved of ['zh', 'en']) test(`remembered manual choice ${saved}`, async () => {
  const f = fixture({ saved }); await flush(); assert.deepEqual(f.values, [saved]); assert.equal(f.requests.length, 0); f.controller.dispose();
});
test('manual English wins over late Chinese lookup', async () => {
  const f = fixture({ wait: true }); f.controller.select('en');
  f.resolve({ ok: true, json: async () => ({ country: 'CN' }) }); await flush();
  assert.deepEqual(f.values, ['en']); assert.deepEqual(f.writes, [['yuxino:site-language:manual:v1', 'en']]); f.controller.dispose();
});
test('timeout and even an uncooperative late fetch never switch language', async () => {
  const f = fixture({ wait: true }); await new Promise(r => setTimeout(r, 1520));
  f.resolve({ ok: true, json: async () => ({ country: 'CN' }) }); await flush();
  assert.deepEqual(f.values, ['en']); f.controller.dispose();
});
test('language link remains explicit with storage blocked and preserves parameters/hash', async () => {
  const f = fixture({ blocked: true, wait: true });
  const link = new f.Element('A', { hreflang: 'zh-CN', href: '/?utm_source=test#download' });
  f.listeners.get('click')({ target: link });
  assert.equal(link.attrs.href, '/?utm_source=test&lang=zh#download');
  f.resolve({ ok: true, json: async () => ({ country: 'US' }) }); await flush(); f.controller.dispose();
});
test('no cookies, referrer, or persisted IP/country', async () => {
  const f = fixture({ country: 'CN' }); await flush();
  const [endpoint, init] = f.requests[0];
  assert.equal(endpoint, 'https://api.country.is/'); assert.equal(init.credentials, 'omit');
  assert.equal(init.referrerPolicy, 'no-referrer'); assert.equal(init.cache, 'no-store');
  assert.equal(f.writes.length, 0); f.controller.dispose();
});
