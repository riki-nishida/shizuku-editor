import { Extension } from "@tiptap/core";

type SnapshotShortcutOptions = {
	onSnapshot: () => void;
};

export const SnapshotShortcut = Extension.create<SnapshotShortcutOptions>({
	name: "snapshotShortcut",

	addOptions() {
		return {
			onSnapshot: () => {},
		};
	},

	addKeyboardShortcuts() {
		return {
			"Mod-Shift-s": () => {
				this.options.onSnapshot();
				return true;
			},
		};
	},
});
