import { atom } from "jotai";
import { createWork, deleteWork, listWorks, updateWorkName } from "./commands";
import type { Work } from "./types";

export const workListAtom = atom<Work[]>([]);

export const activeWorkIdAtom = atom<string | null>(null);

export const activeWorkAtom = atom((get) => {
	const works = get(workListAtom);
	const activeId = get(activeWorkIdAtom);
	return works.find((w) => w.id === activeId) ?? null;
});

export const loadWorksAtom = atom(null, async (_get, set) => {
	const result = await listWorks();
	if (result.ok) {
		set(workListAtom, result.value);
	}
});

export const createWorkAtom = atom(
	null,
	async (_get, set, name: string): Promise<string | null> => {
		const result = await createWork(name);
		if (result.ok) {
			const workId = result.value;
			const listResult = await listWorks();
			if (listResult.ok) {
				set(workListAtom, listResult.value);
			}
			return workId;
		}
		return null;
	},
);

export const updateWorkNameAtom = atom(
	null,
	async (_get, set, workId: string, name: string): Promise<boolean> => {
		const result = await updateWorkName(workId, name);
		if (result.ok) {
			set(workListAtom, (prev) =>
				prev.map((w) => (w.id === workId ? { ...w, name } : w)),
			);
			return true;
		}
		return false;
	},
);

export const deleteWorkAtom = atom(
	null,
	async (_get, set, workId: string): Promise<boolean> => {
		const result = await deleteWork(workId);
		if (result.ok) {
			set(workListAtom, (prev) => prev.filter((w) => w.id !== workId));
			return true;
		}
		return false;
	},
);
