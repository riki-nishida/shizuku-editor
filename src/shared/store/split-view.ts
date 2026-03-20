import { selectedNodeAtom } from "@features/work";
import {
	getSplitViewDirection,
	getSplitViewPanes,
	getSplitViewRatio,
	saveSplitViewDirection,
	saveSplitViewPanes,
	saveSplitViewRatio,
} from "@shared/lib/commands/app-state";
import { atomWithOptimisticPersist } from "@shared/lib/optimistic";
import { atom } from "jotai";

export type PaneContent =
	| { type: "scene"; sceneId: string }
	| { type: "empty" };

export type SplitDirection = "horizontal" | "vertical" | "none";

export type ActivePane = "primary" | "secondary";

export type SplitViewState = {
	direction: SplitDirection;
	primaryPane: PaneContent;
	secondaryPane: PaneContent;
	activePane: ActivePane;
};

const initialState: SplitViewState = {
	direction: "none",
	primaryPane: { type: "empty" },
	secondaryPane: { type: "empty" },
	activePane: "primary",
};

export const splitViewStateAtom = atom<SplitViewState>(initialState);

export const splitRatioAtom = atom<number>(0.5);

export const loadSplitViewStateAtom = atom(null, async (_get, set) => {
	const directionResult = await getSplitViewDirection();
	const direction =
		directionResult.ok && directionResult.value !== "none"
			? (directionResult.value as SplitDirection)
			: "none";

	const panesResult = await getSplitViewPanes();
	let primaryPane: PaneContent = { type: "empty" };
	let secondaryPane: PaneContent = { type: "empty" };

	if (panesResult.ok && panesResult.value) {
		if (panesResult.value.primarySceneId) {
			primaryPane = {
				type: "scene",
				sceneId: panesResult.value.primarySceneId,
			};
		}
		if (panesResult.value.secondarySceneId) {
			secondaryPane = {
				type: "scene",
				sceneId: panesResult.value.secondarySceneId,
			};
		}
	}

	const hasContent =
		primaryPane.type !== "empty" || secondaryPane.type !== "empty";
	const finalDirection =
		direction !== "none" && hasContent ? direction : "none";

	set(splitViewStateAtom, (prev) => ({
		...prev,
		direction: finalDirection,
		primaryPane: finalDirection !== "none" ? primaryPane : { type: "empty" },
		secondaryPane:
			finalDirection !== "none" ? secondaryPane : { type: "empty" },
	}));

	const ratioResult = await getSplitViewRatio();
	if (ratioResult.ok) {
		set(splitRatioAtom, ratioResult.value);
	}
});

const persistPaneContents = async (
	primaryPane: PaneContent,
	secondaryPane: PaneContent,
) => {
	await saveSplitViewPanes({
		primarySceneId: primaryPane.type === "scene" ? primaryPane.sceneId : null,
		secondarySceneId:
			secondaryPane.type === "scene" ? secondaryPane.sceneId : null,
	});
};

export const saveSplitRatioAtom = atomWithOptimisticPersist(
	splitRatioAtom,
	saveSplitViewRatio,
);

export const splitDirectionAtom = atom(
	(get) => get(splitViewStateAtom).direction,
);

export const isSplitActiveAtom = atom(
	(get) => get(splitViewStateAtom).direction !== "none",
);

export const activePaneAtom = atom((get) => get(splitViewStateAtom).activePane);

export const primaryPaneContentAtom = atom(
	(get) => get(splitViewStateAtom).primaryPane,
);

export const secondaryPaneContentAtom = atom(
	(get) => get(splitViewStateAtom).secondaryPane,
);

export const toggleSplitViewAtom = atom(null, async (get, set) => {
	const current = get(splitViewStateAtom);
	const selectedNode = get(selectedNodeAtom);

	if (selectedNode?.type !== "scene") {
		return;
	}

	let newDirection: SplitDirection;
	let newPrimaryPane: PaneContent;
	let newSecondaryPane: PaneContent;

	if (current.direction === "none") {
		newDirection = "horizontal";
		newPrimaryPane = { type: "scene", sceneId: selectedNode.id };
		newSecondaryPane = { type: "scene", sceneId: selectedNode.id };

		set(splitViewStateAtom, {
			...current,
			direction: newDirection,
			primaryPane: newPrimaryPane,
			secondaryPane: newSecondaryPane,
			activePane: "primary",
		});
	} else {
		newDirection = "none";
		newPrimaryPane = { type: "empty" };
		newSecondaryPane = { type: "empty" };

		set(splitViewStateAtom, {
			...current,
			direction: newDirection,
			primaryPane: newPrimaryPane,
			secondaryPane: newSecondaryPane,
		});
	}

	await saveSplitViewDirection(newDirection);
	await persistPaneContents(newPrimaryPane, newSecondaryPane);
});

export const setSplitDirectionAtom = atom(
	null,
	async (get, set, direction: SplitDirection) => {
		const current = get(splitViewStateAtom);
		const newPrimaryPane =
			direction === "none" ? { type: "empty" as const } : current.primaryPane;
		const newSecondaryPane =
			direction === "none" ? { type: "empty" as const } : current.secondaryPane;

		set(splitViewStateAtom, {
			...current,
			direction,
			primaryPane: newPrimaryPane,
			secondaryPane: newSecondaryPane,
		});

		await saveSplitViewDirection(direction);
		await persistPaneContents(newPrimaryPane, newSecondaryPane);
	},
);

export const setActivePaneAtom = atom(null, (get, set, pane: ActivePane) => {
	const current = get(splitViewStateAtom);
	set(splitViewStateAtom, {
		...current,
		activePane: pane,
	});
});

export const setPaneContentAtom = atom(
	null,
	async (
		get,
		set,
		{ pane, content }: { pane: ActivePane; content: PaneContent },
	) => {
		const current = get(splitViewStateAtom);

		let newPrimaryPane = current.primaryPane;
		let newSecondaryPane = current.secondaryPane;

		if (pane === "primary") {
			newPrimaryPane = content;
			set(splitViewStateAtom, {
				...current,
				primaryPane: content,
			});
		} else {
			newSecondaryPane = content;
			set(splitViewStateAtom, {
				...current,
				secondaryPane: content,
			});
		}

		await persistPaneContents(newPrimaryPane, newSecondaryPane);
	},
);

export const openInActivePaneAtom = atom(
	null,
	async (get, set, content: PaneContent) => {
		const current = get(splitViewStateAtom);
		const activePane = current.activePane;

		let newPrimaryPane = current.primaryPane;
		let newSecondaryPane = current.secondaryPane;

		if (activePane === "primary") {
			newPrimaryPane = content;
			set(splitViewStateAtom, {
				...current,
				primaryPane: content,
			});
		} else {
			newSecondaryPane = content;
			set(splitViewStateAtom, {
				...current,
				secondaryPane: content,
			});
		}

		await persistPaneContents(newPrimaryPane, newSecondaryPane);
	},
);

export const openInOppositePaneAtom = atom(
	null,
	async (get, set, content: PaneContent) => {
		const current = get(splitViewStateAtom);
		let newPrimaryPane = current.primaryPane;
		let newSecondaryPane = current.secondaryPane;

		if (current.direction === "none") {
			newSecondaryPane = content;
			set(splitViewStateAtom, {
				...current,
				direction: "horizontal",
				secondaryPane: content,
				activePane: "secondary",
			});
			await saveSplitViewDirection("horizontal");
		} else {
			if (current.activePane === "primary") {
				newSecondaryPane = content;
				set(splitViewStateAtom, {
					...current,
					secondaryPane: content,
					activePane: "secondary",
				});
			} else {
				newPrimaryPane = content;
				set(splitViewStateAtom, {
					...current,
					primaryPane: content,
					activePane: "primary",
				});
			}
		}

		await persistPaneContents(newPrimaryPane, newSecondaryPane);
	},
);

export const swapPanesAtom = atom(null, async (get, set) => {
	const current = get(splitViewStateAtom);
	const newPrimaryPane = current.secondaryPane;
	const newSecondaryPane = current.primaryPane;

	set(splitViewStateAtom, {
		...current,
		primaryPane: newPrimaryPane,
		secondaryPane: newSecondaryPane,
	});

	await persistPaneContents(newPrimaryPane, newSecondaryPane);
});
