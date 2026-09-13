import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
// The adoption workflow points this at the actually installed consumer package.
const { startRegionLanguage } = await import(process.env.WEB_SHARED_TEST_ENTRY || 'web-shared/region-language');
const source = `this.start = ${startRegionLanguage.toString()};`;
function fixture({ href = 'https://example.test/', country = 'US', saved = null, blocked = false, failure = false, pending = false, invalid = false, stop = false } = {}) {
  const values = [], requests = [], writes = [], listeners = new Map();
  let settle;
  const response = new Promise(resolve => { settle = resolve; });
  class Element {
    constructor(tag, attributes) { this.tagName = tag; this.attributes = attributes; }
    closest() { return this; }
    getAttribute(key) { return this.attributes[key] ?? null; }
    setAttribute(key, value) { this.attributes[key] = value; }
  }
  const window = {
    location: { href },
    document: { addEventListener: (event, cb) => listeners.set(event, cb), removeEventListener: event => listeners.delete(event) },
    localStorage: {
      getItem() { if (blocked) throw Error('blocked'); return saved; },
      setItem(key, value) { if (blocked) throw Error('blocked'); writes.push([key, value]); },
    },
    fetch(...args) {
      requests.push(args);
      if (failure) return Promise.reject(Error('offline'));
      if (pending) return response;
      return Promise.resolve({ ok: true, json: async () => invalid ? [] : { country } });
    },
    get navigator() { throw Error('Browser language is not geographic evidence'); },
  };
  const context = vm.createContext({ window, URL, Element, AbortController, setTimeout, clearTimeout });
  vm.runInContext(source, context);
  const controller = context.start(value => { values.push(value); if (stop) return false; });
  return { values, requests, writes, listeners, Element, settle, controller };
}
const flush = () => new Promise(resolve => setTimeout(resolve, 5));
for (const country of ['CN', 'HK', 'MO', 'TW']) test(`package: verified ${country} switches only after lookup`, async () => {
  const f = fixture({ country }); assert.deepEqual(f.values, ['en']); await flush();
  assert.deepEqual(f.values, ['en', 'zh']); assert.equal(f.writes.length, 0); f.controller.dispose();
});
for (const country of ['US', 'JP', 'KR', 'SG', 'MY', '', null, 'cn', 'zh-CN', 'China', 'ZZ', 123, {}]) test(`package: ${JSON.stringify(country)} remains English`, async () => {
  const f = fixture({ country }); await flush(); assert.deepEqual(f.values, ['en']); f.controller.dispose();
});
for (const options of [{ failure: true }, { invalid: true }, { blocked: true }]) test(`package: safe fallback ${JSON.stringify(options)}`, async () => {
  const f = fixture(options); await flush(); assert.deepEqual(f.values, ['en']); f.controller.dispose();
});
for (const [path, expected] of [['/?lang=zh','zh'], ['/?lang=en','en'], ['/?lang=zh-CN','zh'], ['/en/', 'en'], ['/zh/', 'zh'], ['/en.html', 'en'], ['/zh.html', 'zh']]) test(`package: deliberate ${path} overrides geography`, async () => {
  const f = fixture({ href: `https://example.test${path}`, country: expected === 'en' ? 'CN' : 'US' });
  assert.deepEqual(f.values, [expected]); assert.equal(f.requests.length, 0); f.controller.dispose();
});
for (const saved of ['en', 'zh']) test(`package: manual ${saved} wins`, () => {
  const f = fixture({ saved }); assert.deepEqual(f.values, [saved]); assert.equal(f.requests.length, 0); f.controller.dispose();
});
test('package: late response cannot overwrite a manual selection', async () => {
  const f = fixture({ pending: true }); f.controller.select('en');
  f.settle({ ok: true, json: async () => ({ country: 'CN' }) }); await flush();
  assert.deepEqual(f.values, ['en']); assert.equal(f.writes.length, 1); f.controller.dispose();
});
test('package: disposal prevents a late update and removes listener', async () => {
  const f = fixture({ pending: true }); f.controller.dispose();
  f.settle({ ok: true, json: async () => ({ country: 'CN' }) }); await flush();
  assert.deepEqual(f.values, ['en']); assert.equal(f.listeners.size, 0);
});
test('package: deadline never guesses Chinese', async () => {
  const f = fixture({ pending: true }); await new Promise(resolve => setTimeout(resolve, 1520));
  f.settle({ ok: true, json: async () => ({ country: 'CN' }) }); await flush();
  assert.deepEqual(f.values, ['en']); f.controller.dispose();
});
test('package: explicit links preserve parameters with blocked storage', () => {
  const f = fixture({ pending: true, blocked: true });
  const link = new f.Element('A', { hreflang: 'zh-CN', href: '/?utm_source=test#download' });
  f.listeners.get('click')({ target: link });
  assert.equal(link.attributes.href, '/?utm_source=test&lang=zh#download'); f.controller.dispose();
});
test('package: no cookies, referrer or persisted IP-country result', async () => {
  const f = fixture({ country: 'CN' }); await flush();
  assert.equal(f.requests[0][0], 'https://api.country.is/');
  assert.equal(f.requests[0][1].credentials, 'omit');
  assert.equal(f.requests[0][1].referrerPolicy, 'no-referrer');
  assert.equal(f.requests[0][1].cache, 'no-store');
  assert.equal(f.writes.length, 0); f.controller.dispose();
});
test('package: prepaint callback can stop negotiation before redirect', () => {
  const f = fixture({ stop: true }); assert.equal(f.requests.length, 0); assert.equal(f.listeners.size, 0);
});
