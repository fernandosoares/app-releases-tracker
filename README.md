# App Releases Tracker

Keep your favorite apps up to date from one desktop dashboard.

App Releases Tracker checks software releases from GitHub, GitLab, and Gitea-compatible hosts (including Codeberg), then shows you what changed and what needs attention.

## Quick Links

- Latest release: https://github.com/fernandosoares/app-releases-tracker/releases/latest
- All releases: https://github.com/fernandosoares/app-releases-tracker/releases
- All tags: https://github.com/fernandosoares/app-releases-tracker/tags

## What You Can Do

- Add apps you want to monitor
- Check updates for one app or all apps
- See update status in a clean list
- Download updates from inside the app (choose release and asset)
- Search, filter, and sort tracked apps
- Receive desktop notifications for new versions

## Help Menu

The app now includes quick actions in the Help menu:

- Show Version
- Check for Updates (for App Releases Tracker itself)
- Open Releases Page

## Download and Install

Go to the releases page and choose the file for your system:

- Linux: `.AppImage`
- Windows: `.exe`
- macOS: `.dmg`

Releases page:
https://github.com/fernandosoares/app-releases-tracker/releases

## First-Time Use

1. Open the app.
2. Click Add Application.
3. Paste a repository URL (GitHub, GitLab, or Gitea/Codeberg).
4. Click Track App.
5. Use Check All to refresh statuses.

## Supported Sources

- GitHub Releases
- GitLab Releases (including many self-hosted instances)
- Gitea Releases (including Codeberg)

## Release Integrity (Optional but Recommended)

Each release includes `SHA256SUMS.txt`.

Linux/macOS:

```bash
sha256sum -c SHA256SUMS.txt
```

Windows PowerShell (example):

```powershell
Get-FileHash .\app-releases-tracker.Setup.0.8.1.exe -Algorithm SHA256
```

## Troubleshooting

### AppImage does not open on Linux

```bash
chmod +x app-releases-tracker-*.AppImage
./app-releases-tracker-*.AppImage
```

### No updates found

- Check that the URL points to a real project with published releases.
- Some projects only publish prereleases or drafts.
- Try Check All again after a few minutes.

## For Developers and Contributors

If you want to build or contribute, you can run locally with Node.js and npm.

```bash
npm ci
npm run dev
```

Main workflows in GitHub Actions:

- CI (lint, typecheck, test)
- Release (cross-platform packaging + GitHub release)
- Security (dependency review + CodeQL)

## License

No license file is configured yet.
