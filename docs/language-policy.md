# Shared site language policy

The single maintained implementation is `src/region-language.ts`, exposed as **`web-shared/region-language`** since package version 0.4.0. The subpath has no React runtime import, so React, Next.js and plain JavaScript sites use the same policy.

## Contract

- English is the initial and error-fallback language.
- Automatic Chinese requires a successful Country.is IP-country response containing exactly `CN`, `HK`, `MO` or `TW`.
- Other countries, missing or invalid results, network errors and the 1.5-second deadline leave English selected.
- Browser languages, locale-region tags and time zones are never geographic evidence.
- Explicit `?lang=`, localized routes and saved manual choices override automatic detection, in that order. A late response cannot override a deliberate switch.
- Only deliberate choices use `yuxino:site-language:manual:v1`. Do not persist automatically detected language, IP or country.

Country.is necessarily receives the visitor's network IP. Requests omit cookies and referrers. This code does not log or store the IP. IP location is the network exit point, not guaranteed physical location, and VPNs/proxies can affect it. Do not request precise-location permission.

## Consumer integration

Depend on this repository's archive at a full immutable commit SHA; commit the package-manager-generated lockfile too. Do not use a floating `main` dependency or load executable code from a CDN at runtime. Archives include generated JavaScript under `runtime/`, so language-only consumers do not need a package prepare step. React peers are optional for this subpath; role-picker consumers still supply React and React DOM.

```ts
import { startRegionLanguage } from 'web-shared/region-language';
import type { RegionLanguage } from 'web-shared/region-language';

const controller = startRegionLanguage((language: RegionLanguage) => {
  // Update the site's existing rendering and metadata together.
  render(language);
});
// A custom language control may use controller.select('en').
// Call controller.dispose() when the owning application is destroyed.
```

Existing local `src/region-language.ts` or `lib/region-language.ts` files may be thin re-export adapters only. They must contain no country whitelist, network request or preference logic. This keeps old imports and serialized prepaint bootstraps compatible without maintaining copied implementations.

The shared module owns policy, not page copy, routes or rendering. Sites retain their current translations and explicit language URLs. Neutral static entry points should also be prerendered in English; importing this package alone does not rewrite existing HTML.

## Updating safely

Edit the TypeScript source here, run `npm run build:language` and `npm test`, and commit the generated runtime. Package releases bump the version. Consumers upgrade the pinned commit and lockfile deliberately, after their own tests and build pass.

The reusable `.github/workflows/adopt-region-language.yml` and `scripts/adopt-region-language.mjs` migrate an existing compatible site on a `chore/shared-language-*` branch. The workflow uses only that repository's normal GitHub token, commits only the dependency, generated lockfile and adapter (plus the existing Doro Pages artifact when applicable), and never updates main. Merge or fast-forward only after validation succeeds. It does not need personal access tokens or deployment secrets.

## Tests

`npm test` runs source-level regression tests and tests through the real public package export. The consumer migration reruns the public-export test suite against the installed dependency before building the actual site. The package implementation remains self-contained for existing prepaint serialization.
