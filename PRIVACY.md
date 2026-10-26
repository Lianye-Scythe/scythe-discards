# Privacy policy — Scythe Discards

Effective date: 2026-10-26. Maintainer: [Lianye-Scythe](https://github.com/Lianye-Scythe).

Scythe Discards unloads inactive browser tabs according to your timeout and website exceptions. It operates locally. It has no accounts, analytics, advertising, remote backend, or telemetry.

## Data used

The extension uses tab IDs, window IDs, titles, URLs/hostnames, active/discarded/pinned/audio states and inactivity times to show tabs, calculate timers and apply protections. It does not inject content scripts or read webpage bodies, form inputs, passwords or cookies.

Website rules use hostnames. URL paths, query parameters, ports and protocols are not part of an exact-hostname rule. Domain scope is calculated locally from the bundled Public Suffix List; no hostname lookup service is contacted.

## Storage and retention

- `chrome.storage.local`: mode, timeout, pause state, theme and website exceptions remain until changed or the extension is uninstalled. These are not synced through `storage.sync`.
- `chrome.storage.session`: tab timers, manual protection and up to the latest 200 activity events. Events include time, tab ID, hostname, event type and, for failures, Chrome error details. Raw error details may include browser-provided identifiers or URLs. Session data is cleared when the extension is disabled, reloaded, updated or Chrome fully restarts. Worker suspension does not clear it.
- `localStorage`: the selected theme is cached only to avoid a flash of the wrong theme before settings load.

You can remove website rules and clear recent activity in the settings UI. Clearing activity does not remove your settings. Uninstalling removes the extension's browser-managed storage.

If you explicitly allow the extension in incognito, it applies the same local rules to tabs Chrome makes available to it. The extension does not claim a separate private-history database or automatic protection for every private tab.

## Sharing and network access

The extension does not transmit this information to the maintainer or any third party. All runtime code, CSS, icons, translations and suffix data are packaged locally. The development scripts and CI separately download build dependencies and Chrome for Testing; they are not included as runtime services.

## Permissions

- `tabs`: read tab metadata, inspect states and request tab discarding.
- `storage`: save settings and bounded session state.
- `alarms`: check timeouts without one persistent timer per tab.

No website content access, native messaging or debugger permission is requested by the distributed extension. Browser-debugging capabilities used in automated tests are restricted to isolated test profiles and are not extension permissions.

## Contact and changes

Use this project's GitHub Issues after publication, or the maintainer's GitHub profile. This document will be updated alongside any material change in data handling.
