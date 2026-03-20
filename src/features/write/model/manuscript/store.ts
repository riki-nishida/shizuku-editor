import { atom } from "jotai";
import type { ManuscriptSceneData, ManuscriptState } from "./types";

const initialState: ManuscriptState = {
	isActive: false,
	chapterId: null,
	scenes: [],
	modifiedSceneIds: new Set(),
};

export const manuscriptStateAtom = atom<ManuscriptState>(initialState);

export const isManuscriptModeAtom = atom(
	(get) => get(manuscriptStateAtom).isActive,
);

export const manuscriptScenesAtom = atom(
	(get) => get(manuscriptStateAtom).scenes,
);

export const manuscriptChapterIdAtom = atom(
	(get) => get(manuscriptStateAtom).chapterId,
);

export const manuscriptModifiedScenesAtom = atom(
	(get) => get(manuscriptStateAtom).modifiedSceneIds,
);

export const enterManuscriptModeAtom = atom(
	null,
	(
		_get,
		set,
		{ chapterId, scenes }: { chapterId: string; scenes: ManuscriptSceneData[] },
	) => {
		set(manuscriptStateAtom, {
			isActive: true,
			chapterId,
			scenes,
			modifiedSceneIds: new Set<string>(),
		});
	},
);

export const exitManuscriptModeAtom = atom(null, (_get, set) => {
	set(manuscriptStateAtom, initialState);
});

export const updateManuscriptScenesAtom = atom(
	null,
	(
		get,
		set,
		{
			scenes,
			modifiedSceneIds,
		}: { scenes: ManuscriptSceneData[]; modifiedSceneIds: Set<string> },
	) => {
		const current = get(manuscriptStateAtom);
		set(manuscriptStateAtom, {
			...current,
			scenes,
			modifiedSceneIds: new Set([
				...current.modifiedSceneIds,
				...modifiedSceneIds,
			]),
		});
	},
);

export const markScenesSavedAtom = atom(
	null,
	(get, set, savedSceneIds: string[]) => {
		const current = get(manuscriptStateAtom);
		const newModified = new Set(current.modifiedSceneIds);
		for (const id of savedSceneIds) {
			newModified.delete(id);
		}
		set(manuscriptStateAtom, {
			...current,
			modifiedSceneIds: newModified,
		});
	},
);
