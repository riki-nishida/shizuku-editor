import {
	getSidebarSectionRatio,
	getSidebarSections,
	type SidebarSections,
	saveSidebarSectionRatio,
	saveSidebarSections,
} from "@shared/lib/commands/app-state";
import {
	atomWithOptimisticPersist,
	atomWithOptimisticUpdate,
} from "@shared/lib/optimistic";
import { atom } from "jotai";

export type { SidebarSections };

const DEFAULT_SECTIONS: SidebarSections = {
	outline: true,
	materials: true,
};

const DEFAULT_SECTION_RATIO = 0.6;

export const sidebarSectionsAtom = atom<SidebarSections>(DEFAULT_SECTIONS);

export const loadSidebarSectionsAtom = atom(null, async (_get, set) => {
	const result = await getSidebarSections();
	if (result.ok) {
		set(sidebarSectionsAtom, result.value);
	}
});

export const toggleSidebarSectionAtom = atomWithOptimisticUpdate(
	sidebarSectionsAtom,
	(current, section: keyof SidebarSections) => ({
		...current,
		[section]: !current[section],
	}),
	saveSidebarSections,
);

export const sidebarSectionRatioAtom = atom<number>(DEFAULT_SECTION_RATIO);

export const loadSidebarSectionRatioAtom = atom(null, async (_get, set) => {
	const result = await getSidebarSectionRatio();
	if (result.ok) {
		set(sidebarSectionRatioAtom, result.value);
	}
});

export const saveSidebarSectionRatioAtom = atomWithOptimisticPersist(
	sidebarSectionRatioAtom,
	saveSidebarSectionRatio,
);
