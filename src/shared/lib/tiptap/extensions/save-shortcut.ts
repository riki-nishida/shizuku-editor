import { Extension } from "@tiptap/core";

type SaveShortcutOptions = {
	onSave: () => void;
};

export const SaveShortcut = Extension.create<SaveShortcutOptions>({
	name: "saveShortcut",

	addOptions() {
		return {
			onSave: () => {},
		};
	},

	addKeyboardShortcuts() {
		return {
			"Mod-s": () => {
				this.options.onSave();
				return true;
			},
		};
	},
});
