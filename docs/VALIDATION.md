# Validation

## v0.3.4

GitHub publication is gated by validation of the version tag. The [release workflow](https://github.com/Lianye-Scythe/scythe-discards/actions/workflows/release.yml) runs the same Windows/Linux matrix as [main-branch CI](https://github.com/Lianye-Scythe/scythe-discards/actions/workflows/ci.yml), then builds and publishes the tagged source. See the [release](https://github.com/Lianye-Scythe/scythe-discards/releases/tag/v0.3.4) for downloads and the source commit.

| Check | Scope |
| --- | --- |
| Local type checking and core/i18n tests | Passed; 32 tests |
| Installed Windows Chrome 156.0.8078.48 | English, Traditional Chinese and Simplified Chinese each passed 8 API/lifecycle cases + 16 UI groups |
| Release CI gate | The tagged commit must pass type checking, 32 tests and the same three-language browser suite on both Windows and Linux |
| Popup inspection | Light/dark themes, 320px English scope selection, full-width settings navigation, keyboard focus and associated protection descriptions |
| Release ZIP | 19 runtime/legal files; manifest version and SHA256SUMS verified locally; CI verifies its own package checksum before publication |

Screenshots use isolated Windows test profiles and fixture websites. The [image index](images/README.md) records their source; each README uses matching interface-language captures. Browser-test filenames use the extension's actual manifest version.

Tests exercise real discard/reload behavior, normal/strict protections, alarms and worker recovery, website scope and inherited protection, Undo, form/navigation state, theme changes, keyboard paths, long hostnames, connection/action failures and bounded activity pagination. The popup retains explicit domain targets and rule sources while reducing always-visible supporting text.

These results cover the fixtures and interaction paths exercised. Real sleep/wake, long-term use, hundreds of real tabs, memory benefit, macOS and complete WCAG conformance remain outside the demonstrated scope. The extension does not promise a fixed RAM ceiling or second-exact scheduling.

Reports are generated under the Git-ignored `artifacts/` directory, with screenshots in `artifacts/screenshots/`, and retained as GitHub Actions artifacts according to the workflow policy. See the [test guide](../tests/README.md) for commands and fixture details.

Earlier validation summaries remain in Git history. The [changelog](../CHANGELOG.md) and release tags record previous versions.
