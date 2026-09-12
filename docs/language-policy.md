# Site language policy

The initial client language is English. Automatic Chinese is allowed only after a successful IP-country response containing exactly `CN`, `HK`, `MO`, or `TW`. Every other country, missing/invalid data, HTTP error, network error, and timeout keeps English.

Do not use `navigator.language`, `navigator.languages`, a browser locale region such as `en-CN`, operating-system language, or time zone as evidence of physical location. In particular, a Chinese browser abroad must not automatically trigger Chinese.

## Explicit choices

Priority is an explicit `?lang=en|zh|zh-CN`, an explicitly localized URL, a saved manual choice, then the automatic policy. Language links and buttons are deliberate user actions and remain available regardless of country. They take precedence over a late network response.

Use `yuxino:site-language:manual:v1` only for deliberate language choices, never for an automatically detected language. Storage is optional. Language links retain an explicit query parameter so they also work with storage disabled. Existing automatic/browser-derived preferences are not migrated into this manual-only key.

## Implementation

The canonical implementation is `src/region-language.ts`. Sites vendor it into their own source tree and bundle it locally; do not load executable JavaScript from a shared CDN at runtime. Render the callback language and update document language, visible text, accessible labels, and page metadata together. Hydrate only when the prerendered language matches the selected language; otherwise render a fresh tree.

The client calls `https://api.country.is/` with no cookies and no referrer, a 1.5-second deadline, and no result persistence. Only the returned country code is used. The service necessarily receives the visitor's network IP, but this implementation does not log or save it. A blocked lookup is not a reason to guess Chinese. IP location describes the network exit point, not guaranteed physical location; VPNs, proxies and database inaccuracies can affect it. No precise-location permission is requested.

Automatic selection requires JavaScript. Existing explicit language documents and article URLs retain their routing and static content; new neutral prerendered entry points should use English. Never remove the manual language controls or break old language links to implement automatic selection.

## Regression tests

With Node 22.16 or later:

```sh
node --experimental-strip-types --test tests/region-language.test.mjs
```

Tests cover the four accepted regions, other/invalid countries, explicit choices, browser-language independence, blocked storage, failed lookups, deadline handling, delayed responses after a manual switch, and preservation of URL parameters and fragments.
