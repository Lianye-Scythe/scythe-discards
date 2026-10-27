# Validation

## v0.3.3 release baseline

The source repository is public. Ordinary Releases are automatically published after validation of the requested version tag; see the [Releases page](https://github.com/Lianye-Scythe/scythe-discards/releases) for available downloads. This summary describes the tested release baseline at commit `8f74ddc`, not a promise of broad browser or workload coverage.

| Check | Recorded result |
| --- | --- |
| Type checking and core/i18n tests | Passed; 32 tests |
| Linux Chrome for Testing | English, Traditional Chinese and Simplified Chinese each passed 8 API/lifecycle cases + 16 UI groups |
| Windows Chrome for Testing | The same three-language matrix passed |
| Installed Windows Chrome | Traditional Chinese passed the same 8 + 16 groups |
| Release workflow | Both OS jobs and the initial draft creation passed; subsequent automated publication also passed |
| Release ZIP | 19 files; SHA256SUMS verified; runtime matches both CI builds |

Evidence: [main-branch CI](https://github.com/Lianye-Scythe/scythe-discards/actions/runs/40349873313) and [tag/release CI](https://github.com/Lianye-Scythe/scythe-discards/actions/runs/40350912938). Testing used isolated profiles. The CI browser was Chrome for Testing 156.0.8078.47; the separately installed Windows browser was 156.0.8078.48. Windows copies of text/HTML files differ only in line endings from the Linux release package.

These results cover the fixtures and interaction paths exercised. Real sleep/wake, long-term use, hundreds of real tabs, memory benefit, macOS and complete WCAG conformance remain outside the demonstrated scope. Reports and captures are generated under the Git-ignored `artifacts/` and `.impeccable/review/` directories and retained as GitHub Actions artifacts according to the workflow policy.

## Checks after publication

- [Automated publication](https://github.com/Lianye-Scythe/scythe-discards/actions/runs/40419235002) validated the existing v0.3.3 tag and completed the public release with ZIP and checksum assets.
- [Windows/Linux three-language CI](https://github.com/Lianye-Scythe/scythe-discards/actions/runs/40423142819) passed after activity-fixture setup was isolated from background writes. The fixture is checked before testing 50/50/25 pagination; production behavior was unchanged.

## Historical records

Earlier development checks and UI findings are kept in [archived validation records](archive/validation-history.md) and the [v0.1 UI review](archive/ui-review-v0.1.md). Their version and publication statements describe those historical stages.
