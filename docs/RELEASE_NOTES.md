# Scythe Discards v0.3.3

Scythe Discards is a local Chrome extension that unloads inactive background pages on a timer while keeping their tabs and URLs.

## Features

- Normal and strict timeout modes, with active-tab, website and manual protections.
- Exact-hostname or domain-and-subdomains rules, clear rule sources, quick removal and Undo.
- Compact Chrome-style settings and popup, keyboard-operable long-host disclosures, and system/manual light-dark themes.
- English, Traditional Chinese and Simplified Chinese following Chrome's UI language.
- Recent activity capped at 200 session events, displayed 50 per page, with a clear action.
- Local data handling, no telemetry or remote backend, and MIT licensing.

## Install

Download **scythe-discards-0.3.3.zip**, extract it to a permanent folder, then enable Developer mode at `chrome://extensions` and choose **Load unpacked**. Select the extracted folder containing `manifest.json`. **SHA256SUMS** is provided beside the ZIP. GitHub's automatic Source code archives require a build first.

## Updating an unpacked installation

Keep the existing installation folder path, replace its contents with the new ZIP contents, then click **Reload** at `chrome://extensions`. The folder may keep its old `chrome-discards` name. Keeping the path preserves the unpacked extension's ID and website settings.

Reloading/updating starts a new session: inactivity timers, per-tab manual protection and recent activity reset. Stored mode, timeout, theme and website exceptions remain.

## Validation scope

The local build passed type checking, 32 core/i18n tests, and 8 API/lifecycle cases plus 16 UI groups for each of three languages on Linux, and Traditional Chinese in installed Windows Chrome. See [recorded validation](https://github.com/Lianye-Scythe/scythe-discards/blob/main/docs/VALIDATION.md) for details and scope.

Tests use isolated profiles. Returning to a discarded tab reloads it and unsaved page state may be lost. Sleep/wake, long-term operation, real browsing workloads and actual memory benefit remain separate usage tests; the extension does not promise a fixed memory ceiling or second-exact execution.
