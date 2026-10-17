# Note Purge

An Obsidian plugin that adds a **Delete N results…** item to the search pane's
⋯ menu (the one next to the result count, with *Copy search results* and
*Bookmark…*). It deletes every file in the current results, so searching for
`tag:#project`, or clicking a tag in the Tags pane, lets you delete every note
with that tag at once.

## Install

### With BRAT (desktop, iPhone, iPad, Android)

1. Install **BRAT** from **Settings → Community plugins → Browse** and enable it.
2. Open the command palette and run **BRAT: Plugins: Add a beta plugin for
   testing (with or without version)**, then enter
   `joelreymont/obsidian-note-purge`.
3. Enable **Note Purge** in **Settings → Community plugins**.

BRAT also installs updates when new releases are published.

### Manually

1. Download `main.js`, `manifest.json` and `styles.css` from the
   [latest release](https://github.com/joelreymont/obsidian-note-purge/releases/latest).
2. Put them in `<your vault>/.obsidian/plugins/note-purge/`.
3. In **Settings → Community plugins**, turn off Restricted mode if it is on,
   click the reload button, and enable **Note Purge**.

## Use

1. Search for a tag (`tag:#project`), or click a tag in the Tags pane.
2. Click the result count (**3 results ⋯**) at the top of the search pane.
3. Choose **Delete 3 results…**. A dialog lists every file that will be
   deleted. Nothing is touched until you click **Delete 3 files**.

Good to know:

- Files are deleted according to **Settings → Files and links → Deleted
  files**: system trash, the vault's `.trash` folder, or permanently. The
  dialog says which, and warns in red when deletion is permanent.
- `tag:#project` also matches nested tags such as `#project/sub`. That is how
  Obsidian's search works, so check the list in the dialog.
- The item is disabled while a search is still running and when there are no
  results.
- Attachments that only the deleted notes linked to are not deleted.
- The search pane's ⋯ menu has no documented plugin API. The plugin uses the
  internal `search:results-menu` event, which Obsidian's own Bookmarks plugin
  uses to add *Bookmark…*. If a future Obsidian release changes it, the item
  just stops appearing; it cannot delete the wrong files.

Tested on Obsidian 1.14.4, on desktop and in Obsidian's phone and tablet
layouts (mobile emulation). Requires 1.6.6 or later.

## Build from source

```bash
npm install
npm run build   # type-checks, then bundles src/main.ts into main.js
```

## Release

Bump `version` in `manifest.json`, `package.json` and `versions.json`, then push
a tag with the same version (for example `1.0.1`). The release workflow builds
the plugin and attaches `main.js`, `manifest.json` and `styles.css`.
