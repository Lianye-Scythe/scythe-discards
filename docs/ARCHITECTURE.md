# Architecture

Scythe Discards is a local Manifest V3 extension that requests unloading of inactive Chrome pages after a configured timeout. It keeps tabs and URLs available for reloading. Its timer policy operates independently of available RAM; the extension does not measure memory savings or enforce a RAM ceiling.

## Module boundaries

| Source | Responsibility |
| --- | --- |
| [background.ts](../src/background.ts) | Chrome adapters, event listeners and serialized operations |
| [core/policy.ts](../src/core/policy.ts) | Pure decisions, hostname matching and tab reconciliation |
| [core/controller.ts](../src/core/controller.ts) | Settings, session state, sweeps, retries and activity retention |
| [core/allowlist.ts](../src/core/allowlist.ts) | Exact-host and domain scope selection, including inherited rules |
| [core/model.ts](../src/core/model.ts) | Shared state and message contracts |
| [ui/](../src/ui/) | React settings and popup, shared controls and state hooks |
| [i18n/](../src/i18n/) | Three-language catalogs and message compilation |

The worker does not load React. The UI communicates through typed runtime messages and snapshots; no page content scripts or remote backend are used.

## Discard policy

Both modes require an expired inactivity timeout. Both keep active tabs in every window, visible peers in a supported split-view group, website exceptions and manually protected tabs loaded.

| Additional condition | Normal mode | Strict mode |
| --- | --- | --- |
| Pinned tab | Keep loaded | May request unloading |
| Playing audio | Keep loaded | May request unloading |
| `autoDiscardable === false` | Keep loaded | May request unloading |

Only HTTP/HTTPS pages are candidates. Closed, already discarded or unsupported pages are skipped. Strict mode relaxes the extension's additional safeguards; Chrome still decides whether a request can succeed. Important websites with unsaved work or ongoing calls should be protected explicitly.

## Inactivity and rule changes

- The timer starts when a tab leaves active use. Returning cancels it; leaving again starts a complete new timeout.
- A background tab that has never been selected starts from its creation time. Background scripts, reloads and audio do not reset inactivity.
- Losing focus to another application does not make each Chrome window's active tab eligible.
- Removing the final website or manual protection grants a complete new timeout. Resuming automation also resets background timers.
- Changing mode or timeout keeps the existing inactivity origin; shortening a timeout can make a page due at the next check.
- When a new browser session or extension reload leaves no trustworthy prior timestamp, observation starts a fresh timeout.

Elapsed wall-clock time can include sleep. Scheduling, wakeup and API behavior can delay processing; see [validation limits](VALIDATION.md).

## Website exceptions

Rules use normalized hostnames rather than full-URL substring matching. Paths, protocols and ports do not affect the hostname match: `http://docs.example.com:8080/a` and `https://docs.example.com/b` receive the same rule.

An exact `docs.example.com` rule does not protect `mail.example.com`. An `example.com` rule including subdomains protects both, while excluding lookalikes such as `notexample.com` and `example.com.attacker.test`.

Domain selection uses bundled `tldts` data, including private suffixes: `alice.github.io` is not broadened to `github.io`. Public suffixes, IP addresses and localhost do not receive broad subdomain rules. Inherited protection exposes its source rule; undo targets the specific rule identity.

These rules are stored by the extension independently of Chrome's native site exceptions.

## State and scheduling

| Storage | Data |
| --- | --- |
| `chrome.storage.local` | Mode, timeout, website rules, pause and theme settings |
| `chrome.storage.session` | Tab inactivity/protection state, retries and the latest 200 activity events |

A single alarm checks candidates at a nominal 30-second interval. The worker ensures that the alarm exists when it starts and restores session state after worker suspension. Automation clears the alarm while paused.

Operations run through one queue. A sweep scans tabs, sorts due candidates by inactivity age, and checks the latest tab, settings and active state before each request. A generation change or a 15-second sweep budget stops the current batch so later events can be handled. Candidate selection costs O(n) for scanning plus O(k log k) for sorting k due tabs.

Successful unloading is recorded only after confirmation. When Chrome returns a replacement tab ID, state moves to that ID. Failed requests use bounded retry delays of 30, 60, 120 and 300 seconds without resetting the inactivity origin.

## UI and localization

The options UI has settings, website exceptions, tabs and activity destinations. The popup provides pause, current-tab protection and website scope actions. State refreshes preserve drafts, search and focus; activity is shown in pages of 50.

Chrome selects English, Traditional Chinese or Simplified Chinese through native i18n. Stored activity and errors use codes that are localized for display. See [translation maintenance](I18N.md) and [UI guidelines](design/README.md).

## Build inputs and permissions

`scripts/build.mjs` bundles local JavaScript and CSS, compiles the locale catalogs, generates icons from `public/icon.png` and its provenance record, and assembles license notices. Tailwind class detection is explicitly limited to `src/ui/`, so documentation and local tooling cannot add utility rules. The packaged extension is built from `dist/`; working notes and tooling state are not build inputs.

The required permissions are `tabs`, `storage` and `alarms`. There is no telemetry, account service or native messaging host. See the [privacy policy](../PRIVACY.md), [test guide](../tests/README.md) and [publishing process](PUBLISHING.md).
