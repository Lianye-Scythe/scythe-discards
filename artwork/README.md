# Scythe Discards artwork

The owner requested an anime girl portrait inspired by their supplied character image. The original reference is not included in the repository or extension package.

- `portrait.png`: detailed companion portrait, generated with the built-in image_gen tool.
- `../public/icon.png`: simplified head-only icon used by the extension. Golden hair and eyes, a sunflower straw hat and emerald ribbons preserve the reference character cues.
- The adjacent `.png.json` files record the exact prompts, tool and reference relationship. The PNG files also embed their prompt provenance.
- The build creates transparent 16, 32, 48 and 128px PNGs, preserving provenance. No background removal or synthetic transparency is applied after generation.
- `legacy-icon.svg` preserves the earlier geometric icon source for project history; it is no longer shipped.

The repository uses the owner-selected MIT license. Third-party software notices are documented separately in `THIRD_PARTY_NOTICES.md`.
