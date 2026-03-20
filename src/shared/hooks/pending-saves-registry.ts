type SaveFunction = () => Promise<boolean>;

const pendingSaves = new Set<SaveFunction>();

export const pendingSavesRegistry = {
	register: (save: SaveFunction) => {
		pendingSaves.add(save);
	},

	unregister: (save: SaveFunction) => {
		pendingSaves.delete(save);
	},

	flushAll: async (): Promise<boolean> => {
		const saves = Array.from(pendingSaves);
		const results = await Promise.all(
			saves.map((save) => save().catch(() => false)),
		);
		return results.some((saved) => saved);
	},
};
