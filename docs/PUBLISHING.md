# Publishing a release

Product: **Scythe Discards**. Repository/package: `scythe-discards`. License: MIT, selected by the owner.

## Local release preparation

1. Use the Node LTS version in `.nvmrc` and the exact lockfile: `npm ci`.
2. Run `npm run check`, `npm test`, `npm run build` and `npm run test:setup`.
3. Run `npm run test:locales` to test English, Simplified Chinese and Traditional Chinese in isolated Chrome profiles.
4. Run `npm run package`. The ZIP and SHA256SUMS are written to `artifacts/`.
5. Review `PRIVACY.md`, `docs/RELEASE_NOTES.md`, screenshots and the package contents.

The GitHub repository has not been created merely by preparing these files. Repository creation, pushing a public repository, publishing a release and submitting a store listing are separate publication actions.

## First GitHub release

The proposed target is `Lianye-Scythe/scythe-discards`, with `main` as the default branch and `v0.3.3` as the first release tag.

1. Review the initial source commit, MIT license, artwork sources, three READMEs and screenshot assets. Builds and temporary reports stay out of Git; distributable ZIPs belong in Releases.
2. Create the repository with the owner's selected visibility and push `main`.
3. Wait for the first Windows/Linux CI run, including all three UI languages, to pass. Local results do not establish a successful GitHub-hosted run.
4. Push the matching `v0.3.3` tag. After validation, the release workflow creates a draft release with the ZIP, SHA256SUMS and release notes.
5. Check the draft assets and notes, then publish the release when approved. Releases are ordinary releases unless explicitly marked as prereleases.

Contributor guidance and a bug-report form are included. The public README screenshots use only isolated test fixtures. Source code, `dist/`, the ZIP and screenshots are distinct artifacts; the automatic GitHub Source code archive requires building before it can be loaded into Chrome.

## GitHub automation

The CI workflow checks Windows and Linux with Node from `.nvmrc`, exact dependencies, core tests and three UI languages. It retains reports, screenshots and ZIPs as workflow artifacts.

Pushing a `v*` tag runs validation and then prepares a **draft release**. The tag must match the package version. The workflow does not publish the draft automatically. Workflow actions are pinned to verified release commit SHAs.

## Chrome Web Store preparation

- Name, description and interface: `en`, `zh_TW`, `zh_CN`. Store descriptions and screenshots are separate listing assets; use the matching language.
- Publish a reachable privacy-policy URL based on `PRIVACY.md` and keep it consistent with the implemented local data handling.
- Explain `tabs`, `storage` and `alarms` by their actual uses. Do not claim the extension handles no user data; it uses tab metadata locally.
- Describe strict timeout, the possibility of losing unsaved content, website-rule scope and scheduling delays accurately.
- Record compatibility and real workload evidence; avoid unsupported RAM-saving percentages or guarantees.

Use the current store dashboard for submission and required fields. No store submission is performed by the local build or CI.
