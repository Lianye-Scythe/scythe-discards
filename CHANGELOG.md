# Changelog

## 0.3.3 — 2026-10-26

- Present inherited website protection with its rule source, a lock indicator and management action; keep scope selection available for explicit parent-rule changes.
- Compact popup spacing and remove repeated exact-hostname helper text.
- Shorten long hostnames while retaining both ends; provide a keyboard-operable disclosure with the full selectable hostname or rule source.
- Prioritize reconnection over old success notices, preserving focus and keeping pending Undo available until the connection returns.
- Extend rendered regressions for narrow hostname disclosures, inherited sources and recovery feedback priority.

## 0.3.2 — 2026-10-26

- Make popup content scroll independently, reserving space for the footer and inline notifications.
- Pause notification dismissal during keyboard focus, pointer hover and pending actions; keep errors until dismissed and restore focus after dismissal or Undo.
- Distinguish loading, unavailable and reconnecting states from running/paused; label cached data with its last update and prevent changes until reconnected.
- Use compact scope labels with a separate hostname/domain explanation and a target-specific accessible name.
- Consolidate popup/activity CSS, remove unused selectors, and separate notification lifecycle from the extension transport hook.
- Add rendered regressions for long hostnames, notice focus/timers, stale data/retry and application/transport errors.

## 0.3.1 — 2026-10-26

- Align input and select focus indicators with their borders instead of applying a separated ring to every control.
- Retain compact keyboard focus rings for buttons, switches and radio controls; inset navigation and list-link focus.
- Keep invalid input focus red and toast action focus visible against inverse surfaces.

## 0.3.0 — 2026-10-26

- Added a transparent anime portrait icon with generated 16/32/48/128px assets and source provenance.
- Scythe Discards naming; MIT license.
- English, Traditional Chinese and Simplified Chinese interface and metadata.
- Popup hostname/domain scope, quick rule removal, undo and inherited-protection source.
- PSL-aware domain extraction, safe broader-rule handling and stale-ID protection.
- Bounded activity UI with pagination, clear action and localized event codes.
- Cross-platform browser validation and draft-release automation.

## 0.2.0 — 2026-10-26

- React interface with shared Radix-based controls and Chrome Settings styling.
- Four real destinations, persistent form drafts/search and stable focused controls on refresh.
- System/manual light and dark themes and revised popup.

## 0.1.0 — 2026-10-26

- Manifest V3 extension with normal/strict timeout discard, website exceptions, manual protection, pause/resume, retries and bounded session activity.
