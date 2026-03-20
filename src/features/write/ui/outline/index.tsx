import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useChapterExpansion } from "../../model/outline/hooks/use-chapter-expansion";
import { useOutlineNodes } from "../../model/outline/hooks/use-outline-nodes";
import { useStructuredOutline } from "../../model/outline/hooks/use-structured-outline";
import { chapterToExpandAtom } from "../../model/outline/store";
import { searchPanelVisibleAtom } from "../../model/search/store";
import { SearchPanel } from "../search-panel";
import styles from "./styles.module.css";
import { OutlineTree } from "./tree/outline-tree";

type Props = {
	workId: string | null;
};

export const Outline = ({ workId }: Props) => {
	const { t } = useTranslation();
	const { nodes } = useOutlineNodes(workId);
	const [chapterToExpand, setChapterToExpand] = useAtom(chapterToExpandAtom);
	const isSearchPanelVisible = useAtomValue(searchPanelVisibleAtom);

	const { active } = useStructuredOutline({ nodes });

	const { expand } = useChapterExpansion(active);

	useEffect(() => {
		if (chapterToExpand === null) return;
		expand(chapterToExpand);
		setChapterToExpand(null);
	}, [chapterToExpand, expand, setChapterToExpand]);

	if (isSearchPanelVisible) {
		return <SearchPanel />;
	}

	return (
		<section className={styles.root} aria-label={t("common.documentOutline")}>
			<div className={styles.body}>
				<OutlineTree chapters={active} workId={workId} />
			</div>
		</section>
	);
};
