# Contributing

English · [简体中文](CONTRIBUTING.zh-CN.md)

Installation reports, clearer documentation, anonymized screenshots and focused fixes are welcome. You do not need to start with code.

## Report a problem

Include your Codex, Loader and plugin versions, reproduction steps, expected behavior and actual behavior. Remove account details, project content, private paths and credentials from screenshots and logs. For compatibility reports, include the operating system and architecture.

## Make your first change

1. Discuss larger features in an issue first. Small documentation corrections can go straight to a PR.
2. Fork this repository and work on your own branch. Keep each PR focused on one problem.
3. Start with `scripts/better-ui-imropvement.js`, `manifest.json` and `test/`. Follow the README for development prerequisites and packaging.
4. From the repository root, run:

```powershell
npm run check
npm test
```

5. Explain the problem, the change and what you actually verified. For a behavior fix, include a regression test; for a UI change, include anonymized before/after screenshots. Documentation-only changes need link, image and bilingual consistency checks.

## Working together

- Keep factual user-documentation changes aligned in English and Chinese. Label illustrative data.
- Keep the plugin independent from Loader and use its public plugin interface.
- Keep real chats, account data and machine-specific operational files out of the repository.
- Leave version bumps, release tags and publishing to the maintainer after acceptance.
- If you are unsure where to begin, a reproducible issue is a useful first contribution. Discuss concrete behavior and evidence, and respect contributors with different experience levels.
