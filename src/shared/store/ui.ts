import { DEFAULT_PANEL_SIZES } from "@shared/constants/layout";
import {
	getInspectorCollapsed,
	getPanelSizes,
	saveInspectorCollapsed,
	savePanelSizes,
} from "@shared/lib/commands/app-state";
import {
	atomWithOptimisticPersist,
	atomWithOptimisticTransform,
} from "@shared/lib/optimistic";
import { atom } from "jotai";

export const appInitializedAtom = atom<boolean>(false);

export const liveWordCountAtom = atom<number>(0);

export const settingsDialogOpenAtom = atom<boolean>(false);
export const settingsDialogInitialTabAtom = atom<string | null>(null);
export const exportDialogOpenAtom = atom<boolean>(false);
export const keyboardShortcutsDialogOpenAtom = atom<boolean>(false);
export const aboutDialogOpenAtom = atom<boolean>(false);

export const searchPanelOpenAtom = atom<boolean>(false);
export const searchTermAtom = atom<string>("");
export const replaceTermAtom = atom<string>("");
export const searchCaseSensitiveAtom = atom<boolean>(false);

const DEFAULT_SIZES = [
	DEFAULT_PANEL_SIZES.sidebar,
	DEFAULT_PANEL_SIZES.main,
	DEFAULT_PANEL_SIZES.inspector,
];

export const panelSizesAtom = atom<number[]>(DEFAULT_SIZES);

export const loadPanelSizesAtom = atom(null, async (_get, set) => {
	const result = await getPanelSizes();
	if (result.ok) {
		set(panelSizesAtom, result.value);
	}
});

export const savePanelSizesAtom = atomWithOptimisticPersist(
	panelSizesAtom,
	savePanelSizes,
);

export const inspectorCollapsedAtom = atom<boolean>(false);

export const loadInspectorCollapsedAtom = atom(null, async (_get, set) => {
	const result = await getInspectorCollapsed();
	if (result.ok) {
		set(inspectorCollapsedAtom, result.value);
	}
});

export const toggleInspectorCollapsedAtom = atomWithOptimisticTransform(
	inspectorCollapsedAtom,
	(current) => !current,
	saveInspectorCollapsed,
);

export const setInspectorCollapsedAtom = atomWithOptimisticPersist(
	inspectorCollapsedAtom,
	saveInspectorCollapsed,
);
