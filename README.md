# True Calendar

True Calendar is a desktop calendar app built with Electron, React, TypeScript, and Vite.

It supports local calendar items, `.ics` imports, Canadian holidays, and Google Calendar read-only sync.

## Features

- Month calendar view with a collapsible months sidebar
- Local saved items for individual days
- `.ics` calendar import
- Google Calendar sync with OAuth
- Multi-calendar enable/disable controls
- Google calendar unsync/removal
- Multi-day event rendering
- Timed event details in the day dialog
- Calendar color and text color support when provided by Google

## Requirements

- Node.js
- npm
- A Google Cloud OAuth client if you want Google Calendar sync

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

This starts the Vite/Electron development app.

If you change Electron main or preload code, fully restart the dev process so those changes are loaded.

## Google Calendar Sync

Google Calendar sync is read-only. Events are pulled into the app and displayed alongside imported and local items.

### Google Cloud setup

1. Create or select a Google Cloud project.
2. Enable the Google Calendar API.
3. Configure the OAuth consent screen.
4. Create an OAuth client.
5. Add your OAuth client secret to `.env.dev`.

The current client ID is configured in `electron/main.ts`.

Create a local `.env.dev` file:

```env
GOOGLE_CALENDAR_CLIENT_SECRET=your-client-secret
```

`.env.dev` is ignored by git.

### Connect

1. Start the app.
2. Open the sidebar.
3. Click `Connect Google`.
4. Complete the Google sign-in flow.
5. Click `Sync Google` later to refresh events.

## Icons

Production icon assets live in:

```text
build/
```

Currently used:

```text
build/icon.png
```

Recommended production assets:

```text
build/icon.png   # Linux/AppImage and source asset
build/icon.ico   # Windows
build/icon.icns  # macOS
```

Use a transparent `1024x1024` PNG as the source image when generating platform icons.

## Build

```bash
npm run build
```

The build runs TypeScript, Vite, and Electron Builder. Packaged output is written under:

```text
release/
```

## Quality Checks

```bash
npm run lint
```

```bash
./node_modules/.bin/tsc.cmd --noEmit
```

On non-Windows systems, use the local `tsc` binary for your shell.

## Project Structure

```text
electron/                 Electron main and preload processes
src/components/           React UI components
src/context/              Calendar state and sync mapping
src/utils/                Calendar parsing and helpers
build/                    Production icon resources
electron-builder.json5    Packaging config
```

## Notes

- Google sync stores token and calendar state in Electron's app data directory.
- Google all-day date-only events are parsed as local dates to avoid timezone drift.
- Google all-day event end dates are treated as exclusive, matching Google Calendar behavior.
