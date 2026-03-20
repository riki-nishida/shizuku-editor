import {
	type KnowledgeOutline,
	type KnowledgeTypeOutline,
	knowledgeListAtom,
	knowledgeTypesAtom,
	loadKnowledgeAtom,
	TypeIcon,
} from "@features/knowledge";
import { linkKnowledgeAtom } from "@features/write";
import { Dialog } from "@shared/ui/dialog";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

type KnowledgePickerDialogProps = {
	open: boolean;
	onClose: () => void;
	sceneId: string;
	workId: string;
	excludeIds: string[];
};

type GroupedKnowledge = {
	type: KnowledgeTypeOutline | null;
	items: KnowledgeOutline[];
};

export const KnowledgePickerDialog = ({
	open,
	onClose,
	sceneId,
	workId,
	excludeIds,
}: KnowledgePickerDialogProps) => {
	const { t } = useTranslation();
	const knowledgeList = useAtomValue(knowledgeListAtom);
	const knowledgeTypes = useAtomValue(knowledgeTypesAtom);
	const loadKnowledge = useSetAtom(loadKnowledgeAtom);
	const linkKnowledge = useSetAtom(linkKnowledgeAtom);

	useEffect(() => {
		if (open && knowledgeList === null) {
			loadKnowledge(workId);
		}
	}, [open, workId, knowledgeList, loadKnowledge]);

	const grouped = useMemo(() => {
		if (!knowledgeList) return [];

		const available = knowledgeList.filter(
			(k: KnowledgeOutline) => !excludeIds.includes(k.id),
		);

		const typeMap = new Map<string | null, KnowledgeOutline[]>();
		for (const k of available) {
			const key = k.type_id;
			const list = typeMap.get(key);
			if (list) {
				list.push(k);
			} else {
				typeMap.set(key, [k]);
			}
		}

		const groups: GroupedKnowledge[] = [];
		if (knowledgeTypes) {
			for (const t of knowledgeTypes) {
				const items = typeMap.get(t.id);
				if (items) {
					groups.push({ type: t, items });
					typeMap.delete(t.id);
				}
			}
		}
		const uncategorized = typeMap.get(null);
		if (uncategorized) {
			groups.push({ type: null, items: uncategorized });
		}

		return groups;
	}, [knowledgeList, knowledgeTypes, excludeIds]);

	const totalCount = useMemo(
		() => grouped.reduce((sum, g) => sum + g.items.length, 0),
		[grouped],
	);

	const handleSelect = useCallback(
		async (knowledge: KnowledgeOutline) => {
			const success = await linkKnowledge({ sceneId, knowledge });
			if (success) {
				onClose();
			}
		},
		[sceneId, linkKnowledge, onClose],
	);

	const handleOpenChange = useCallback(
		(details: { open: boolean }) => {
			if (!details.open) {
				onClose();
			}
		},
		[onClose],
	);

	return (
		<Dialog.ControlledRoot open={open} onOpenChange={handleOpenChange}>
			<Dialog.Frame open={open}>
				<Dialog.Content className={styles.pickerDialog}>
					<Dialog.Header
						title={t("inspector.relatedKnowledge.linkMaterial")}
						onClose={onClose}
					/>
					<div className={styles.pickerBody}>
						{totalCount === 0 ? (
							<div className={styles.emptyList}>
								{t("common.noLinkableMaterials")}
							</div>
						) : (
							grouped.map((group) => {
								const typeColor = group.type?.color ?? "var(--text-tertiary)";
								return (
									<div
										key={group.type?.id ?? "__uncategorized"}
										className={styles.pickerSection}
									>
										<div className={styles.pickerSectionHeader}>
											<span className={styles.pickerSectionIcon}>
												<TypeIcon
													name={group.type?.name ?? t("common.uncategorized")}
													color={group.type?.color ?? null}
													icon={group.type?.icon ?? null}
												/>
											</span>
											<span className={styles.pickerSectionName}>
												{group.type?.name ?? t("common.uncategorized")}
											</span>
										</div>
										<div
											className={styles.pickerSectionItems}
											style={
												{
													"--type-color": typeColor,
												} as React.CSSProperties
											}
										>
											{group.items.map((knowledge) => (
												<button
													key={knowledge.id}
													type="button"
													className={styles.pickerItem}
													onClick={() => handleSelect(knowledge)}
												>
													<span className={styles.pickerItemTitle}>
														{knowledge.title}
													</span>
												</button>
											))}
										</div>
									</div>
								);
							})
						)}
					</div>
				</Dialog.Content>
			</Dialog.Frame>
		</Dialog.ControlledRoot>
	);
};
