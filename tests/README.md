# Tests

Run commands from the repository root after `npm ci`. The [contributing guide](../CONTRIBUTING.md) covers the development environment.

| Location | Coverage |
| --- | --- |
| `unit/policy.test.ts` | Timeout rules, hostname/domain scope and protected tabs |
| `unit/controller.test.ts` | State persistence, restarts, races, retries and bounded activity |
| `unit/i18n.test.ts` | Catalog keys, placeholders, message compilation and localized errors |
| `browser/run.mjs` | Isolated Chrome profile, fixture server and API/lifecycle cases |
| `browser/ui-flows.js` | Settings, website rules, About/resources, popup, navigation and activity flows |
| `browser/ui-regressions.mjs` | Focus, long hostnames, notifications and transport failures |

## Run checks

```bash
npm run check
npm run check:repo
npm test
npm run build
npm run test:setup
npm run test:browser
npm run test:ui -- --locale=zh-TW
```

`npm test` runs unit tests. Browser commands use the built `dist/` extension; `test:setup` downloads stable Chrome for Testing. `test:browser` runs the API/lifecycle cases, while `test:ui` runs those cases plus UI flows. Use `en`, `zh-CN` or `zh-TW` for a single language. `npm run test:locales` runs the full browser suite for all three languages and is used by CI on Windows and Linux.

The [Windows launcher](../scripts/test-windows.ps1) can test installed Chrome with an explicit workspace and Node executable. It also uses an isolated profile.

## Fixtures and reports

The browser runner serves local fixture pages and creates a temporary browser profile. Tests alter only that profile's state; production code has no test-control message endpoint. Activity pagination loads a verified 125-event fixture after stopping background writes, then checks 50/50/25 pages and clearing.

Results and failures are written to `artifacts/`; UI screenshots are written to `artifacts/screenshots/`. Temporary profiles are removed on exit. Reports and captures are ignored by Git and uploaded by CI according to its retention policy.

About cases cover manifest-version display without a background connection, hash/history and draft preservation, keyboard expansion of ZIP update instructions, safe resource tabs and the readable bundled license. The latest-release navigation uses a local intercepted response rather than contacting GitHub. The five navigation items are checked for fitting labels and page reflow at 620px, 380px and 320px in each language.

`npm run check:repo` checks the tracked file set and public Markdown references. Ignored local files must not be added to Git or used as documentation targets.

See [validation and limits](../docs/VALIDATION.md) for the demonstrated coverage. These fixtures do not establish real-workload RAM savings or long-term sleep/wake reliability.
