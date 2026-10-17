import { App, Menu, Modal, Notice, Plugin, Setting, TFile, View } from "obsidian";

// The core Search view triggers "search:results-menu" just before showing its
// ⋯ menu (the one with "Copy search results"); the core Bookmarks plugin hooks
// it to add "Bookmark". Neither the event nor these view fields are in
// obsidian.d.ts, so they are declared here and checked at runtime.
interface SearchView extends View {
	getQuery(): string;
	dom: {
		// True while the search is still scanning the vault.
		working: boolean;
		getFiles(): TFile[];
	};
}

type TrashOption = "system" | "local" | "none";

declare module "obsidian" {
	interface Workspace {
		on(
			name: "search:results-menu",
			callback: (menu: Menu, view: SearchView) => unknown,
			ctx?: unknown,
		): EventRef;
	}

	interface Vault {
		getConfig(key: "trashOption"): TrashOption | undefined;
	}
}

export default class NotePurgePlugin extends Plugin {
	async onload() {
		this.registerEvent(
			this.app.workspace.on("search:results-menu", (menu, view) =>
				this.addDeleteItem(menu, view),
			),
		);
	}

	private addDeleteItem(menu: Menu, view: SearchView) {
		if (typeof view?.dom?.getFiles !== "function") return;

		const searching = view.dom.working;
		// Snapshot the results now so the files deleted are exactly the ones
		// listed in the confirmation dialog.
		const files = view.dom.getFiles();
		const title = searching
			? "Delete results (wait for search to finish)"
			: `Delete ${plural(files.length, "result")}…`;

		menu.addItem((item) =>
			item
				.setSection("danger")
				.setIcon("lucide-trash-2")
				.setTitle(title)
				.setWarning(true)
				.setDisabled(searching || files.length === 0)
				.onClick(() =>
					new ConfirmDeleteModal(this.app, view.getQuery(), files).open(),
				),
		);
	}
}

class ConfirmDeleteModal extends Modal {
	constructor(
		app: App,
		private readonly query: string,
		private readonly files: TFile[],
	) {
		super(app);
	}

	onOpen() {
		const { contentEl, files } = this;
		const count = plural(files.length, "file");

		this.setTitle(`Delete ${count}?`);
		contentEl.createEl("p", {
			text: `Every file matching “${this.query}” will be deleted:`,
		});

		const list = contentEl.createEl("ul", {
			cls: "note-purge-list",
		});
		for (const file of files) list.createEl("li", { text: file.path });

		const trashOption = this.app.vault.getConfig("trashOption");
		contentEl.createEl("p", {
			cls: trashOption === "none" ? "note-purge-warning" : "",
			text: describeTrash(trashOption),
		});

		new Setting(contentEl)
			.addButton((button) =>
				button.setButtonText("Cancel").onClick(() => this.close()),
			)
			.addButton((button) =>
				button
					.setButtonText(`Delete ${count}`)
					.setWarning()
					.onClick(() => {
						this.close();
						void deleteFiles(this.app, files);
					}),
			);
	}

	onClose() {
		this.contentEl.empty();
	}
}

async function deleteFiles(app: App, files: TFile[]) {
	const progress = new Notice(`Deleting ${plural(files.length, "file")}…`, 0);
	let deleted = 0;
	const failed: string[] = [];

	for (const file of files) {
		// Already gone since the dialog opened: nothing left to do.
		if (app.vault.getFileByPath(file.path) !== file) continue;
		try {
			// Honours Settings → Files and links → Deleted files.
			await app.fileManager.trashFile(file);
			deleted++;
		} catch (error) {
			console.error(`note-purge: could not delete ${file.path}`, error);
			failed.push(file.path);
		}
		progress.setMessage(`Deleting… ${deleted + failed.length} / ${files.length}`);
	}

	progress.hide();
	if (failed.length === 0) {
		new Notice(`Deleted ${plural(deleted, "file")}.`);
	} else {
		new Notice(
			`Deleted ${plural(deleted, "file")}; ${failed.length} failed ` +
				"(see the developer console for details).",
			0,
		);
	}
}

function describeTrash(option: TrashOption | undefined): string {
	switch (option) {
		case "system":
			return "They will be moved to the system trash.";
		case "local":
			return "They will be moved to the vault's .trash folder.";
		case "none":
			return "They will be permanently deleted. This cannot be undone.";
		default:
			return "They will be deleted according to Settings → Files and links → Deleted files.";
	}
}

function plural(count: number, noun: string): string {
	return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
