import {
	atomWithOptimisticPersist,
	atomWithOptimisticTransform,
	atomWithOptimisticUpdate,
} from "@shared/lib/optimistic";
import { atom } from "jotai";
import {
	getInspectorSections,
	getInspectorTab,
	type InspectorSections,
	saveInspectorSections,
	saveInspectorTab,
} from "./commands";

const DEFAULT_INSPECTOR_SECTIONS: InspectorSections = {
	versionHistory: false,
};

export const inspectorSectionsAtom = atom<InspectorSections>(
	DEFAULT_INSPECTOR_SECTIONS,
);

export const loadInspectorSectionsAtom = atom(null, async (_get, set) => {
	const result = await getInspectorSections();
	if (result.ok) {
		set(inspectorSectionsAtom, {
			...DEFAULT_INSPECTOR_SECTIONS,
			...result.value,
		});
	}
});

export const toggleInspectorSectionAtom = atomWithOptimisticUpdate(
	inspectorSectionsAtom,
	(current, sectionId: string) => ({
		...current,
		[sectionId]: !(current[sectionId] ?? false),
	}),
	saveInspectorSections,
);

export const expandAllInspectorSectionsAtom = atomWithOptimisticTransform(
	inspectorSectionsAtom,
	(current) =>
		Object.fromEntries(
			Object.keys(current).map((key) => [key, false]),
		) as InspectorSections,
	saveInspectorSections,
);

export const collapseAllInspectorSectionsAtom = atomWithOptimisticTransform(
	inspectorSectionsAtom,
	(current) =>
		Object.fromEntries(
			Object.keys(current).map((key) => [key, true]),
		) as InspectorSections,
	saveInspectorSections,
);

export const inspectorTabAtom = atom<string>("meta");

export const loadInspectorTabAtom = atom(null, async (_get, set) => {
	const result = await getInspectorTab();
	if (result.ok) {
		set(inspectorTabAtom, result.value);
	}
});

export const setInspectorTabAtom = atomWithOptimisticPersist(
	inspectorTabAtom,
	saveInspectorTab,
);
