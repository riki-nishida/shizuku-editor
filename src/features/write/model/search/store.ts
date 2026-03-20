import { sidebarSectionsAtom } from "@shared/store";
import { atom } from "jotai";
import type { ProjectSearchResult } from "./types";

export const searchPanelVisibleAtom = atom<boolean>(false);

export const materialsHiddenBySearchAtom = atom(false);

export const openSearchPanelAtom = atom(null, (get, set) => {
	const sections = get(sidebarSectionsAtom);
	if (sections.materials) {
		set(materialsHiddenBySearchAtom, true);
		set(sidebarSectionsAtom, { ...sections, materials: false });
	}
	set(searchPanelVisibleAtom, true);
});

export const closeSearchPanelAtom = atom(null, (get, set) => {
	const wasHidden = get(materialsHiddenBySearchAtom);
	if (wasHidden) {
		const sections = get(sidebarSectionsAtom);
		set(sidebarSectionsAtom, { ...sections, materials: true });
		set(materialsHiddenBySearchAtom, false);
	}
	set(searchPanelVisibleAtom, false);
});

export const editorJumpTargetAtom = atom<{
	sceneId: string;
	charOffset: number;
	length: number;
} | null>(null);

export const searchQueryAtom = atom<string>("");

export const searchCaseSensitiveAtom = atom<boolean>(false);

export const replaceTextAtom = atom<string>("");

export const searchResultAtom = atom<ProjectSearchResult | null>(null);

export const selectedMatchIndexAtom = atom<number>(-1);
