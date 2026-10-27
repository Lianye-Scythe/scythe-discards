# Scythe Discards v0.3.4

Scythe Discards is a local Chrome extension that unloads inactive background pages on a timer while keeping their tabs and URLs.

## What's changed

- A clearer popup with the current page title as its heading, shorter supporting text and more distinct primary controls.
- Consistent Protect this tab / Protect this website labels in English, Traditional Chinese and Simplified Chinese, with visible explanations of when protection ends.
- A scope selector that states when subdomains are excluded, while retaining explicit domain targets, inherited rule sources and management actions.
- A full-width All settings row, keyboard navigation and control descriptions for assistive technology.
- Updated README screenshots in all three languages.

## Install

Download **scythe-discards-0.3.4.zip**, extract it to a permanent folder, then enable Developer mode at `chrome://extensions` and choose **Load unpacked**. Select the extracted folder containing `manifest.json`. **SHA256SUMS** is provided beside the ZIP. GitHub's automatic Source code archives require a build first.

## Updating an unpacked installation

Keep the existing installation folder path, replace its contents with the new ZIP contents, then click **Reload** at `chrome://extensions`. The folder may keep its old `chrome-discards` name. Keeping the path preserves the unpacked extension's ID and website settings.

Reloading/updating starts a new session: inactivity timers, per-tab manual protection and recent activity reset. Stored mode, timeout, theme and website exceptions remain.

## Validation scope

Publication is gated by type checking, 32 core/i18n tests, 8 API/lifecycle cases and 16 UI groups per language on both Windows and Linux. Local installed Windows Chrome also passed all three languages. See [validation and scope](https://github.com/Lianye-Scythe/scythe-discards/blob/v0.3.4/docs/VALIDATION.md) and the [release workflow runs](https://github.com/Lianye-Scythe/scythe-discards/actions/workflows/release.yml) for the tagged build.

Tests use isolated profiles. Returning to a discarded tab reloads it and unsaved page state may be lost. Sleep/wake, long-term operation, real browsing workloads and actual memory benefit remain separate usage tests; the extension does not promise a fixed memory ceiling or second-exact execution.
