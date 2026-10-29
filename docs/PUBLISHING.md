# Publishing a release

Product: **Scythe Discards**. Repository: [Lianye-Scythe/scythe-discards](https://github.com/Lianye-Scythe/scythe-discards). License: MIT.

## Automatic publication

Pushing a stable version tag such as `v0.3.3` triggers **Publish release**:

1. Check out that tag and validate it on Windows and Linux, including all three UI languages.
2. Check that the tag uses `vMAJOR.MINOR.PATCH` and matches the tagged `package.json` version.
3. Build the extension ZIP and verify its SHA256SUMS.
4. Create or resume a temporary draft and upload the ZIP and checksum.
5. Automatically publish an ordinary Release. There is no manual publication gate or Pre-release flag.

The CI workflow and the packaging job check out the same tag. A failed validation or asset upload prevents publication. Runs for the same tag are serialized. If a release is already public, a rerun leaves its existing assets unchanged.

This automates GitHub Releases. Chrome Web Store submission is a separate process.

## Prepare the next version

1. Update `package.json`, `package-lock.json` and `public/manifest.json` consistently.
2. Update `CHANGELOG.md` and `docs/RELEASE_NOTES.md` with the resulting user-visible behavior and relevant validation.
3. Use the Node LTS version in `.nvmrc` and the exact lockfile: `npm ci`.
4. Run `npm run check`, `npm test`, `npm run build`, `npm run test:setup` and `npm run test:locales`.
5. Review the package with `npm run package`, commit the changes and push `main`.
6. Create and push the matching version tag. That push authorizes the workflow to publish the release after CI passes.

For example, after committing version `0.3.5`:

```bash
git tag -a v0.3.5 -m "Scythe Discards v0.3.5"
git push origin v0.3.5
```

The workflow attaches the extension ZIP and SHA256SUMS. GitHub's automatic Source code archives require building before they can be loaded into Chrome. Builds and temporary reports stay out of Git.

## Retry an existing tag

The workflow also supports **Run workflow** on the default branch, with an existing tag as input. This uses the current automation while validating and packaging the selected tag; the tag itself is not moved.

```bash
gh workflow run release.yml --ref main -f tag=v0.3.3
```

A draft can be resumed automatically. Published releases are preserved; use a new version for changed runtime content.

GitHub references: [reusable workflow inputs](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows), [manual workflow runs](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

## Chrome Web Store preparation

- Name, description and interface: `en`, `zh_TW`, `zh_CN`. Store descriptions and screenshots are separate listing assets.
- Publish a reachable privacy-policy URL based on `PRIVACY.md` and keep it consistent with the implemented local data handling.
- Explain `tabs`, `storage` and `alarms` by their actual uses. The extension uses tab metadata locally.
- Describe strict timeout, unsaved-content behavior, website-rule scope and scheduling delays accurately.
- Record compatibility and real workload evidence; avoid unsupported RAM-saving percentages or guarantees.

Use the current store dashboard for submission. GitHub automation does not submit a store listing.
