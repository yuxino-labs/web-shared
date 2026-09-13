import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
for (const resolution of ['node', 'bundler']) test(`public types resolve with ${resolution} module resolution`, () => {
  const dir = mkdtempSync(join(tmpdir(), 'web-shared-types-'));
  try {
    mkdirSync(join(dir, 'node_modules'));
    symlinkSync(root, join(dir, 'node_modules/web-shared'), 'dir');
    const input = join(dir, 'consumer.ts');
    writeFileSync(input, `import { startRegionLanguage, type RegionLanguage } from 'web-shared/region-language';
const result = startRegionLanguage((language: RegionLanguage) => { console.log(language); });
result.select('en');
result.dispose();
`);
    assert.doesNotThrow(() => execFileSync(process.execPath, [tsc, '--noEmit', '--strict', '--skipLibCheck', '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', resolution, input], { cwd: dir, stdio: 'pipe' }));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
