# Release notes

Before tagging a version, write `docs/RELEASE-<version>.md` and include it in the tagged commit. Lead with the user-visible outcome, group changes into relevant categories such as Fixed or Added, and explain upgrade actions, compatibility changes and known limitations where applicable. Provide Chinese and English notes and a comparison link to the previous release.

Review the notes against the diff since the previous tag. Include only shipped changes and completed validation. Follow the user-focused approach in [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the highlights, categorized changes and upgrade guidance in [GitHub CLI releases](https://github.com/cli/cli/releases).

The release workflow requires a nonempty version-specific file and publishes its contents directly in the GitHub Release body. Reruns update the body as well as the assets. A generated commit list or comparison link alone does not replace release notes.

After publishing, verify the public Release's tag, body, ZIP and checksum. The body must match the version-specific notes. Package and source versions must match the tag.
