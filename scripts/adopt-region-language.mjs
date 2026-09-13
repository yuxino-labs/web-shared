// Run from a consumer checkout. Only the explicitly named migration branch may be updated.
import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const root = process.cwd();
const sharedRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ref = process.env.SHARED_LANGUAGE_REF || '';
const branch = process.env.SHARED_LANGUAGE_BRANCH || '';
if (!/^[a-f0-9]{40}$/.test(ref)) throw Error('A full immutable shared commit SHA is required');
if (!/^chore\/shared-language-[a-zA-Z0-9._-]+$/.test(branch)) throw Error('Refusing to write outside a dedicated migration branch');
const run = (command, args, options = {}) => execFileSync(command, args, {
  cwd: root, stdio: 'inherit', env: { ...process.env, CI: 'true', NEXT_TELEMETRY_DISABLED: '1' }, ...options,
});
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const regionPath = ['src/region-language.ts', 'lib/region-language.ts'].find(existsSync);
if (!regionPath) throw Error('No existing region-language adapter found; manual integration required');
const previous = readFileSync(regionPath, 'utf8');
if (!previous.includes('startRegionLanguage')) throw Error('Unexpected adapter content; refusing replacement');
const extraExports = [...previous.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/g)].map(match => match[1]);
if (extraExports.some(name => name !== 'startRegionLanguage')) throw Error('Local adapter exports additional behavior; manual integration required');
pkg.dependencies ??= {};
pkg.dependencies['web-shared'] = `https://codeload.github.com/yuxino-labs/web-shared/tar.gz/${ref}`;
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
writeFileSync(regionPath,
  '// Language policy is maintained and tested in yuxino-labs/web-shared.\n' +
  '// Only this adapter remains locally so existing imports and static bootstraps keep working.\n' +
  'export { startRegionLanguage } from "web-shared/region-language";\n' +
  'export type { RegionLanguage, RegionLanguageOptions } from "web-shared/region-language";\n');
// Match production when npm and pnpm lockfiles coexist; update both, not just one.
const hasNpmLock = existsSync('package-lock.json');
const hasPnpmLock = existsSync('pnpm-lock.yaml');
const deployment = existsSync('.github/workflows/deploy.yml') ? readFileSync('.github/workflows/deploy.yml', 'utf8') : '';
const npmProduction = /\bnpm (?:ci|install)\b/.test(deployment);
let command = hasPnpmLock && !npmProduction ? 'pnpm' : 'npm';
if (hasPnpmLock) {
  const workspaceFile = 'pnpm-workspace.yaml';
  let workspace = existsSync(workspaceFile) ? readFileSync(workspaceFile, 'utf8') : '';
  // Limit permission to this immutable package, preserving every unrelated build rule.
  const permission = '  ' + JSON.stringify(`web-shared@${pkg.dependencies['web-shared']}`) + ': true\n';
  if (!workspace.includes(permission.trim())) {
    if (/^allowBuilds:[ \t]*(?:#[^\n]*)?$/m.test(workspace)) {
      workspace = workspace.replace(/^allowBuilds:[ \t]*(?:#[^\n]*)?$/m, match => match + '\n' + permission.trimEnd());
    } else if (/^allowBuilds:[ \t]*\{[ \t]*\}[ \t]*$/m.test(workspace)) {
      workspace = workspace.replace(/^allowBuilds:[ \t]*\{[ \t]*\}[ \t]*$/m, 'allowBuilds:\n' + permission.trimEnd());
    } else if (/^allowBuilds:/m.test(workspace)) {
      throw Error('Unexpected allowBuilds syntax; refusing to replace existing supply-chain policy');
    } else workspace = workspace.trimEnd() + '\n\nallowBuilds:\n' + permission;
    writeFileSync(workspaceFile, workspace);
  }
  let version = /^pnpm@(\d+\.\d+\.\d+)/.exec(pkg.packageManager || '')?.[1]
    || pkg.devEngines?.packageManager?.version;
  if (!version && !pkg.packageManager) {
    // Pin the already validated toolchain rather than whichever pnpm happens to be installed.
    version = '12.3.4';
    pkg.packageManager = `pnpm@${version}`;
    writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  }
  if (!/^\d+\.\d+\.\d+$/.test(version || '')) throw Error('Cannot determine the project-pinned pnpm version');
  run('npm', ['install', '--global', `pnpm@${version}`, '--no-audit', '--no-fund']);
  run('pnpm', ['install', '--lockfile-only', '--ignore-scripts', '--no-frozen-lockfile']);
}
if (hasNpmLock || command === 'npm') {
  // Never let a pnpm node_modules tree influence npm's production lockfile.
  rmSync(resolve(root, 'node_modules'), { recursive: true, force: true });
  run('npm', ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund']);
}
if (command === 'pnpm') run('pnpm', ['install', '--frozen-lockfile']);
else run('npm', ['ci', '--no-audit', '--no-fund']);
const dependencyEntry = createRequire(resolve(root, 'package.json')).resolve('web-shared/region-language');
run(process.execPath, ['--test', resolve(sharedRoot, 'tests/region-package.test.mjs')], {
  env: { ...process.env, CI: 'true', WEB_SHARED_TEST_ENTRY: pathToFileURL(dependencyEntry).href },
});
if (pkg.scripts?.test) run(command, ['run', 'test']);
else if (pkg.devDependencies?.['vite-plus'] && ['tests', 'src'].some(dir => existsSync(dir) && readdirSync(dir, { recursive: true }).some(file => /\.test\.[cm]?[jt]sx?$/.test(String(file))))) {
  run(command, ['exec', 'vp', 'test', 'run']);
}
if (!pkg.scripts?.build) throw Error('No build command found');
run(command, ['run', 'build']);
if (existsSync('scripts/verify-site.py')) run('python3', ['scripts/verify-site.py']);
// Doro Pages publishes checked-in docs. Rebuild that artifact too, retaining routing files.
const pages = pkg.name === 'doro-viewer' && Boolean(pkg.scripts?.['build:pages']);
if (pages) {
  const retained = ['docs/CNAME', 'docs/.nojekyll'].filter(existsSync).map(path => [path, readFileSync(path)]);
  run(command, ['run', 'build:pages']);
  for (const [path, bytes] of retained) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, bytes); }
}
const files = ['package.json', regionPath, 'package-lock.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'].filter(existsSync);
if (pages) files.push('docs');
run('git', ['add', '--', ...files]);
const changed = execFileSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8' }).trim();
if (changed) {
  run('git', ['-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
    'commit', '-m', `refactor(i18n): consume web-shared language policy at ${ref.slice(0, 12)}`]);
  run('git', ['push', 'origin', `HEAD:refs/heads/${branch}`]);
}
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
console.log(`SHARED_LANGUAGE_READY=${commit}`);
if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY,
  `Shared package: ${ref}\n\nValidated consumer commit: ${commit}\n\nChanged files:\n\n${changed}\n`, { flag: 'a' });
