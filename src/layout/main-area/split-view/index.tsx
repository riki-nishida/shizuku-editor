import { Splitter } from "@ark-ui/react/splitter";
import { selectedNodeAtom } from "@features/work";
import {
	isSplitActiveAtom,
	primaryPaneContentAtom,
	saveSplitRatioAtom,
	secondaryPaneContentAtom,
	setActivePaneAtom,
	splitDirectionAtom,
	splitRatioAtom,
	splitViewStateAtom,
} from "@shared/store/split-view";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pane } from "./pane";
import styles from "./styles.module.css";

type Props = {
	children: React.ReactNode;
};

const MIN_PANE_SIZE = 20;

export const SplitViewContainer = ({ children }: Props) => {
	const { t } = useTranslation();
	const isSplitActive = useAtomValue(isSplitActiveAtom);
	const direction = useAtomValue(splitDirectionAtom);
	const splitRatio = useAtomValue(splitRatioAtom);
	const saveSplitRatio = useSetAtom(saveSplitRatioAtom);
	const state = useAtomValue(splitViewStateAtom);
	const primaryContent = useAtomValue(primaryPaneContentAtom);
	const secondaryContent = useAtomValue(secondaryPaneContentAtom);
	const setActivePane = useSetAtom(setActivePaneAtom);
	const selectedNode = useAtomValue(selectedNodeAtom);

	const isSceneSelected = selectedNode?.type === "scene";

	const [liveSizes, setLiveSizes] = useState<number[] | null>(null);

	const handleResize = useCallback((details: { size: number[] }) => {
		setLiveSizes(details.size);
	}, []);

	const handleResizeEnd = useCallback(
		(details: { size: number[] }) => {
			setLiveSizes(null);
			const newRatio = details.size[0] / 100;
			void saveSplitRatio(newRatio);
		},
		[saveSplitRatio],
	);

	const panelSizes = useMemo(() => {
		if (liveSizes) return liveSizes;
		const primaryPercent = splitRatio * 100;
		const secondaryPercent = 100 - primaryPercent;
		return [primaryPercent, secondaryPercent];
	}, [splitRatio, liveSizes]);

	if (!isSplitActive || direction === "none" || !isSceneSelected) {
		return <>{children}</>;
	}

	const isHorizontal = direction === "horizontal";

	return (
		<Splitter.Root
			className={styles.splitterRoot}
			orientation={isHorizontal ? "horizontal" : "vertical"}
			size={panelSizes}
			onResize={handleResize}
			onResizeEnd={handleResizeEnd}
			panels={[
				{ id: "primary", minSize: MIN_PANE_SIZE },
				{ id: "secondary", minSize: MIN_PANE_SIZE },
			]}
		>
			<Splitter.Panel id="primary" className={styles.splitterPanel}>
				<Pane
					paneId="primary"
					content={primaryContent}
					isActive={state.activePane === "primary"}
					onActivate={() => setActivePane("primary")}
				/>
			</Splitter.Panel>

			<Splitter.ResizeTrigger
				id="primary:secondary"
				className={`${styles.resizeTrigger} ${isHorizontal ? styles.resizeTriggerHorizontal : styles.resizeTriggerVertical}`}
				aria-label={t("mainArea.adjustPaneSize")}
			/>

			<Splitter.Panel id="secondary" className={styles.splitterPanel}>
				<Pane
					paneId="secondary"
					content={secondaryContent}
					isActive={state.activePane === "secondary"}
					onActivate={() => setActivePane("secondary")}
				/>
			</Splitter.Panel>
		</Splitter.Root>
	);
};

export { Pane } from "./pane";
