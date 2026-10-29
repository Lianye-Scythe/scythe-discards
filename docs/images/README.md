# Documentation images

## Brand icon

The icon source is [public/icon.png](../../public/icon.png); its [generation record](../../public/icon.png.json) is read by the build to preserve embedded provenance in the generated 16, 32, 48 and 128px icons. Rebuilding uses this source and does not require the earlier portrait or legacy icon.

`icon.png` is a copy of the generated 128px icon for the README heading, displayed at 32px. It retains the transparent background and embedded provenance. The source generation record is maintained in one place.

## Preview screenshots

These are unedited screenshots of Scythe Discards v0.3.5 using isolated Windows test profiles and example websites. Webpage titles retain their original language.

| Interface language | Files | Capture source |
| --- | --- | --- |
| English | `popup.png`, `popup-inherited.png`, `settings.png`, `about.png` | Installed Windows Chrome 156.0.8078.48, local validation |
| Traditional Chinese | Corresponding `*-zh-TW.png` files | The same browser and fixtures, with Traditional Chinese UI |
| Simplified Chinese | Corresponding `*-zh-CN.png` files | The same browser and fixtures, with Simplified Chinese UI |

The originals come from the validation recorded in [VALIDATION.md](../VALIDATION.md). The capture runner and UI fixtures are now maintained in `tests/browser/run.mjs` and `tests/browser/ui-flows.js`; see the [test guide](../../tests/README.md). Each language README uses matching interface captures. Regenerate with the same fixtures when the interface changes; keep screenshots free of everyday browsing data.
