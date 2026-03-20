# App Releases Tracker

A desktop app to track releases from GitHub, GitLab, and Gitea-compatible hosts, notify when new versions are available, and keep your app catalog organized in one place.

Built with Electron + TypeScript, using a DDD + Hexagonal core in the Main process and a React + Zustand renderer.

## Why This Project Exists

If you install apps from multiple sources, checking updates manually becomes noisy and easy to forget. This project gives you one lightweight desktop dashboard where you can:

- Track apps by source repository URL
- Check updates on demand or on a schedule
- See which apps have updates available
- Receive desktop notifications when updates are found

## Current Feature Set

### MVP features completed

- Add / remove tracked apps
- Persist data locally with SQLite
- Check one app or all apps for updates
- Background polling scheduler
- Desktop notifications for updates
- Typed IPC contracts with Zod validation
- Secure preload bridge and isolated renderer
- CI and cross-platform release pipeline via GitHub Actions

### Source providers currently supported

- GitHub Releases API
- GitLab Releases API (including self-hosted-style URLs)
- Gitea Releases API (including Codeberg and self-hosted instances)

## Tech Stack

- Electron 31
- TypeScript (strict)
- React 18
- Zustand
- better-sqlite3
- Zod
- Vitest
- electron-vite
- electron-builder

## Architecture

### Main process

Main uses DDD + Hexagonal Architecture:

- `domain/`: entities, value objects, and ports
- `application/`: use cases
- `infrastructure/`: adapters for SQLite, GitHub/GitLab APIs, notifications
- `ipc/`: typed channels + schema-validated handlers

Dependency direction is always inward:

- infrastructure -> application -> domain

### Renderer process

Renderer follows Atomic Design:

- `components/atoms`
- `components/molecules`
- `components/organisms`
- `components/pages`

State is centralized with Zustand in `renderer/store`.

## Security Posture

Electron security defaults are enforced:

- `contextIsolation: true`
- `nodeIntegration: false`
- typed preload bridge only
- no raw IPC in renderer components
- input validation with Zod for IPC payloads
- external link opening restricted to HTTPS via main-process handler

## Project Structure

```text
src/
  main/
    application/
    domain/
    infrastructure/
    ipc/
  preload/
  renderer/
    api/
    components/
    store/
tests/
  unit/
  integration/
```

## Getting Started

### Prerequisites

- Node.js 20+ (Node 24 tested)
- npm
- Linux build tools if on Linux:

```bash
sudo apt-get update
sudo apt-get install -y build-essential
```

### Install

```bash
npm ci
```

### Run in development

```bash
npm run dev
```

### Run checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Release Pipeline

This repository uses two GitHub Actions workflows:

- `CI`: lint, typecheck, tests, and build checks
- `Release`: triggers on tags `v*.*.*`, builds Linux/Windows/macOS packages, and publishes a GitHub Release

### Create a release

```bash
git tag v0.5.0
git push origin v0.5.0
```

The Release workflow will:

1. Run quality checks
2. Build artifacts for each platform
3. Publish assets to GitHub Releases

## Downloading Artifacts

Visit the Releases page:

- `https://github.com/fernandosoares/app-releases-tracker/releases`

Typical artifacts include:

- Linux: `.AppImage`
- Windows: `.exe` installer
- macOS: `.dmg`

## Development Notes

### Environment tokens (optional)

For higher API limits or private release sources:

- `GITHUB_TOKEN`
- `GITLAB_TOKEN`
- `GITEA_TOKEN`

### Data location

SQLite database is stored in Electron `userData` directory as `tracker.db`.

## Testing Strategy

- Unit tests for domain/application/infrastructure components
- Unit tests for renderer components and store behavior
- Integration tests for SQLite repository behavior
- Fast Vitest execution for local feedback loops

## Roadmap (Next Iterations)

- Native download manager with progress and retries
- Release notes preview in UI
- Search/filter/sort for tracked apps
- Additional source providers
- E2E smoke tests for packaged artifacts
- Code signing + notarization

## Contributing

Contributions are welcome.

Suggested workflow:

1. Create a feature branch
2. Keep architecture boundaries clear
3. Add or update tests with your changes
4. Open a PR with a concise technical summary

## Friendly Troubleshooting

### "Release workflow did not publish"

- Confirm tag format is exactly `vX.Y.Z`
- Check Actions tab for failed jobs
- Ensure repository Actions permissions allow `contents: write`

### "No updates detected"

- Verify source URL points to a valid GitHub/GitLab project
- Check if the latest release is draft/prerelease-only
- Re-run `Check All` after updating token environment variables

### "AppImage does not run"

```bash
chmod +x app-releases-tracker-*.AppImage
./app-releases-tracker-*.AppImage
```

### "How do I verify download integrity?"

Each release includes a `SHA256SUMS.txt` file.

On Linux/macOS:

```bash
sha256sum -c SHA256SUMS.txt
```

On Windows PowerShell:

```powershell
Get-FileHash .\app-releases-tracker.Setup.0.5.0.exe -Algorithm SHA256
```

## License

No license file is currently configured. Add one before broad redistribution.
