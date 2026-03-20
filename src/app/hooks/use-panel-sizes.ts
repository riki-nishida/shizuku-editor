import {
	DEFAULT_PANEL_SIZES,
	PANEL_CONSTRAINTS,
} from "@shared/constants/layout";
import { panelSizesAtom, savePanelSizesAtom } from "@shared/store";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { usePanelVisibility } from "./use-panel-visibility";

export const usePanelSizes = () => {
	const { showSidebar, showInspector, inspectorCollapsed } =
		usePanelVisibility();
	const savedSizes = useAtomValue(panelSizesAtom);
	const saveSizes = useSetAtom(savePanelSizesAtom);
	const [liveSizes, setLiveSizes] = useState<number[] | null>(null);

	const panelSizes = liveSizes ?? savedSizes;

	const effectiveSizes = useMemo(() => {
		let [sidebar, main, inspector] =
			panelSizes.length === 3
				? panelSizes
				: [
						DEFAULT_PANEL_SIZES.sidebar,
						DEFAULT_PANEL_SIZES.main,
						DEFAULT_PANEL_SIZES.inspector,
					];

		if (showInspector && !inspectorCollapsed && inspector === 0) {
			inspector = DEFAULT_PANEL_SIZES.inspector;
			main = main - inspector;
		}

		if (showSidebar && sidebar === 0) {
			sidebar = DEFAULT_PANEL_SIZES.sidebar;
			main = main - sidebar;
		}

		main = Math.max(main, PANEL_CONSTRAINTS.main.minSize);

		if (!showSidebar) {
			return [0, main + sidebar + inspector, 0];
		}

		if (!showInspector) {
			return [sidebar, main + inspector, 0];
		}

		if (inspectorCollapsed) {
			return [sidebar, main + inspector, 0];
		}

		return [sidebar, main, inspector];
	}, [panelSizes, showSidebar, showInspector, inspectorCollapsed]);

	const handleResize = useCallback((details: { size: number[] }) => {
		setLiveSizes(details.size);
	}, []);

	const handleResizeEnd = useCallback(
		(details: { size: number[] }) => {
			setLiveSizes(null);

			const [sidebar] = details.size;

			if (sidebar === 0) return;

			saveSizes(details.size);
		},
		[saveSizes],
	);

	return {
		effectiveSizes,
		handleResize,
		handleResizeEnd,
	};
};
