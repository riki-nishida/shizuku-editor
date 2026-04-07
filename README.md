[日本語](README.ja.md) | **English**

# Shizuku Editor

A desktop writing app for authors.

Fully local-first — all your data stays on your machine with no account or internet connection required.

Organize your manuscript into chapters and scenes, track version history with inline diffs, and link character profiles, world-building notes, and other references directly to each scene. Also supports Japanese typography features such as ruby (furigana), emphasis dots, and vertical-in-horizontal text.

## Demo

https://github.com/user-attachments/assets/6599f593-3795-4ac2-8a21-88631c5b3782

## Features

- **Chapters & Scenes** — Outline-based manuscript organization with drag & drop reordering
- **Editor** — Rich text editor. Also supports Japanese typography: ruby (furigana), emphasis dots, and vertical-in-horizontal text
- **Split View** — View and edit two scenes side by side
- **Version History** — Save scene snapshots and review changes with inline diffs
- **Knowledge Base** — Link character profiles, world-building, locations, and other notes to scenes
- **Reference Images** — Attach images to scenes
- **Export** — TXT / DOCX / PDF / ePub output
- **Project-wide Search** — Search and replace across all scenes
- **Focus Mode** — Dim inactive paragraphs to stay focused
- **Backup** — Automatic and manual database backup & restore
- **Dark Mode**
- **Multilingual UI** (Japanese / English)

## Installation

Download from the [Releases](https://github.com/riki-nishida/shizuku-editor/releases) page.

Supports macOS (Apple Silicon / Intel), Windows, and Linux.

> **Note:** This app is not code-signed as it is provided for free. You may see a security warning when launching for the first time.
>
> **macOS**: Right-click the app → "Open", then click "Open" in the dialog. (Or go to System Settings → Privacy & Security → click "Open Anyway".)
>
> **Windows**: Click "More info" on the SmartScreen dialog → "Run anyway".

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite 7, Jotai, TipTap 3, Ark UI, CSS Modules
- **Backend**: Rust, Tauri 2, SQLite (SQLx)
- **Linting**: Biome
- **Testing**: Vitest

### Project Structure

```
src/
  app/          # Entry point, global hooks
  layout/       # Layout
  features/     # Feature modules
  shared/       # Shared UI, utilities, hooks, state
src-tauri/
  src/
    commands/   # IPC command handlers
    services/   # Business logic
    repositories/ # Database access
    models/     # Data types
    db/         # DB initialization & migrations
```

## License

[MIT](LICENSE)

## Acknowledgments

- Sample text: Kenji Miyazawa, [Night on the Galactic Railroad](https://www.aozora.gr.jp/) (Public Domain)
- Sample text: Oscar Wilde, [The Happy Prince](https://www.gutenberg.org/) (Public Domain)
