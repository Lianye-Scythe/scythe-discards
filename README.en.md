# Scythe Discards

[繁體中文](README.md) · [简体中文](README.zh-CN.md) · English

Keep your tabs and URLs while unloading inactive page content on a predictable timer. A local Chrome Manifest V3 extension with a Chrome-style React interface.

[Download v0.3.3](https://github.com/Lianye-Scythe/scythe-discards/releases) · [Report an issue](https://github.com/Lianye-Scythe/scythe-discards/issues) · [Contribute](CONTRIBUTING.md)

| Popup | Inherited website protection |
| --- | --- |
| <img src="docs/images/popup.png" width="280" alt="Popup with automatic discarding, current tab and website protection"> | <img src="docs/images/popup-inherited.png" width="280" alt="Inherited protection with its rule source and management action"> |

[Settings preview](docs/images/settings.png). Captures use Traditional Chinese, an isolated test profile and example websites; the interface also supports English and Simplified Chinese.

## Features

v0.3.3 makes the popup more compact, shows inherited rules explicitly, lets you expand long hostnames, and prioritizes reconnection while retaining Undo.

- Normal mode respects pinned, audio-playing and non-auto-discardable tabs. Strict mode requests a discard when the timer expires despite those soft protections.
- Both modes respect active tabs, active split-view peers, website exceptions and manual per-tab protection.
- Popup scope selection: exact hostname or registrable domain including subdomains, with quick add/remove, undo and inherited-rule provenance.
- Hostname matching ignores URL paths, protocols and ports. Domain extraction uses the Public Suffix List, including private suffixes.
- Recent activity retains at most 200 session events, displayed 50 per page, with a clear action.
- English, Traditional Chinese and Simplified Chinese follow Chrome's UI language, with English fallback. Theme follows the system or a manual light/dark override.
- No content scripts, telemetry, account or remote backend. The background worker does not load React.

Defaults: normal mode, 30 minutes, system theme. Returning to a discarded tab reloads it. Unsaved page state may be lost; sleep, browser scheduling and rejected API calls can delay discarding. No fixed RAM ceiling or second-exact deadline is promised.

## Install or update

Download `scythe-discards-0.3.3.zip` from [Releases](https://github.com/Lianye-Scythe/scythe-discards/releases) and extract it to a permanent folder. `SHA256SUMS` is provided alongside it. GitHub's automatic Source code archives require a build first.

At `chrome://extensions`, enable Developer mode and select **Load unpacked**, choosing the folder containing `manifest.json`. For a local build, choose `dist/`.

For an existing unpacked installation, **keep its folder path**, replace its contents, then click **Reload**. The folder can retain its old `chrome-discards` name; keeping the path preserves its extension ID and stored website settings.

Reload/update resets session timers, manual tab protection and recent activity. Mode, timeout, theme and website exceptions persist.

## Development

Use Node 24.22.1 LTS and npm 12.2.1. Dependencies are exact-pinned.

```bash
npm ci
npm run check
npm test
npm run build
npm run test:setup
npm run test:locales
npm run package
```

The browser setup downloads the current official stable Chrome for Testing and tests isolated profiles. Use `npm run test:ui -- --locale=en` for one language. Reports go to `artifacts/`, captures to `.impeccable/review/` and the distributable to `artifacts/scythe-discards-0.3.3.zip` with `SHA256SUMS`.

See [validation and limits](docs/VALIDATION.md), [release notes](docs/RELEASE_NOTES.md), [privacy policy](PRIVACY.md), [publishing](docs/PUBLISHING.md), [translation maintenance](docs/I18N.md) and [changelog](CHANGELOG.md).

[MIT licensed](LICENSE). Bundled dependencies retain their own license notices.
