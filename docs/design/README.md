# UI guidelines

The interface follows the familiar Chrome Settings direction: system fonts, neutral surfaces, blue interaction states and compact settings rows. The icon supplies the product identity without becoming page decoration.

## Sources of truth

| Source | Purpose |
| --- | --- |
| [styles.css](../../src/ui/styles.css) | Theme tokens, typography, spacing, responsive layout and focus rules |
| [shared controls](../../src/ui/components/ui.tsx) | Button, switch, radio and checkbox behavior |
| [feedback components](../../src/ui/components/feedback.tsx) | Running, loading, stale, connection and action feedback |
| [UI state hook](../../src/ui/use-extension.ts) | Snapshot refreshes and operation state |
| [notification hook](../../src/ui/use-notice.ts) | Undo, dismissal, focus restoration and notification lifetime |

Maintain token values in the stylesheet rather than duplicating a generated token catalog in documentation.

## Layout and controls

- Keep the four options destinations functional, including reload and browser history. Use a compact settings column and a wider tab list where comparison needs space.
- Keep popup controls within its 360px column. Long content scrolls independently from the header, recovery controls, notifications and footer.
- Policy edits use explicit save/cancel actions. Website rules, pause and theme changes apply immediately and show their result.
- Show the exact website scope. Inherited protection uses a lock, source rule and management action. Long hostnames can be expanded with a keyboard to read and select the full value.
- Preserve form drafts, search and keyboard focus through snapshot refreshes.

## Themes and accessibility

- Default to system appearance and retain manual light/dark choices. Keep the same semantic color roles in both themes.
- Use native labels and accessible control semantics. Pair state colors with text or icons.
- Keep input and select focus close to their borders; other controls need visible focus that is not clipped by containers or fixed areas.
- Reflow narrow layouts without losing actions, labels or state. Honor reduced-motion preferences.

## Feedback and product truth

- Distinguish loading, healthy, paused, stale, reconnecting and failed states. Show the last successful update when data is stale and disable unavailable actions.
- Keep errors near the relevant action. Application errors do not automatically mean that the background connection failed.
- Keep Undo available while focused, hovered, busy or disconnected. Recovery must retain the pending undo action and restore useful focus.
- Explain strict-mode risks and the reload behavior of discarded pages. Show actual protection and activity state; memory-savings figures require workload measurements.

For UI changes, check the affected destinations in light/dark themes, all three languages, narrow layouts and keyboard flows. Include long hostnames, notification/recovery states and popup scrolling when relevant. Use the [test guide](../../tests/README.md) and report the scope actually verified; current coverage is summarized in [validation](../VALIDATION.md).
