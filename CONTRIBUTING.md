# Contributing

Bug reports, translations and focused improvements are welcome. Use English, Traditional Chinese or Simplified Chinese.

## Set up

Use the Node LTS version in `.nvmrc` and the npm version in `package.json`. Install the exact dependency tree with `npm ci`.

```bash
npm ci
npm run check:repo
npm run check
npm test
npm run build
npm run test:setup
npm run test:locales
```

`test:setup` downloads stable Chrome for Testing. Browser tests create isolated profiles and local fixture pages. Reports go to `artifacts/`; screenshots go to `artifacts/screenshots/`. Both are ignored by Git. For one UI language, use `npm run test:ui -- --locale=en`.

Load `dist/` as an unpacked extension at `chrome://extensions` to try a local build. Keep an existing installation's folder path when updating. See the README for session reset behavior.

See the [documentation index](docs/README.md) for the repository layout and the [test guide](tests/README.md) for test groups, fixtures and reports.

## Make a change

- Keep the discard policy, controller and browser adapter boundaries clear. Policy behavior belongs in `src/core/`; UI rendering belongs in `src/ui/`.
- Follow the [UI guidelines](docs/design/README.md), including system/manual themes, visible keyboard focus and existing quick actions. UI changes should include relevant screenshots and interaction checks.
- Keep the English, Traditional Chinese and Simplified Chinese catalogs consistent. See [translation maintenance](docs/I18N.md).
- The default `README.md` is English. Keep the [Traditional Chinese](docs/translations/README.zh-TW.md) and [Simplified Chinese](docs/translations/README.zh-CN.md) versions aligned with it.
- Use local runtime assets and libraries. Explain a new dependency or extension permission in the pull request.
- Run checks relevant to the change and state what was verified. A documentation edit does not require repeating the browser suite.

## Report a problem

Include the extension version, Chrome version, operating system, relevant settings, reproduction steps, and expected versus actual behavior. Example hostnames are useful when the specific website does not affect reproduction.

For performance reports, describe the workload and measurement method. The project does not infer memory savings from the number of discarded tabs.

## Pull requests

Keep changes focused and explain the user-visible behavior and validation. Every new file should support using, building, testing or maintaining the extension. Keep tool state, conversation notes, unused artwork, local profiles and temporary reports out of Git. Runtime license notices are assembled by the build; preserve source licenses and the current icon's provenance when changing assets.

`npm run check:repo` rejects tracked files covered by ignore rules and Markdown links to files outside the tracked tree. Run it after adding or moving files; local copies of ignored notes cannot satisfy public documentation links.
