import {
	type KnowledgeTypeOutline,
	knowledgeTypesAtom,
} from "@features/knowledge";
import {
	loadSceneKnowledgeAtom,
	sceneKnowledgeAtom,
	unlinkKnowledgeAtom,
} from "@features/write";
import { showConfirmDialog } from "@shared/lib/dialog";
import { IconButton } from "@shared/ui/icon-button";
import { BookStack, Plus, Xmark } from "iconoir-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { KnowledgeExpandable } from "./knowledge-expandable";
import { KnowledgePickerDialog } from "./knowledge-picker-dialog";
import styles from "./styles.module.css";

type RelatedKnowledgePanelProps = {
	sceneId: string;
	workId: string;
};

export const RelatedKnowledgePanel = ({
	sceneId,
	workId,
}: RelatedKnowledgePanelProps) => {
	const { t } = useTranslation();
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const sceneKnowledge = useAtomValue(sceneKnowledgeAtom);
	const knowledgeTypes = useAtomValue(knowledgeTypesAtom);
	const loadSceneKnowledge = useSetAtom(loadSceneKnowledgeAtom);
	const unlinkKnowledge = useSetAtom(unlinkKnowledgeAtom);

	useEffect(() => {
		loadSceneKnowledge(sceneId);
	}, [sceneId, loadSceneKnowledge]);

	const handleUnlink = useCallback(
		async (knowledgeId: string, title: string) => {
			const confirmed = await showConfirmDialog(
				t("inspector.relatedKnowledge.unlinkConfirm", { title }),
				{ title: t("inspector.relatedKnowledge.unlinkTitle") },
			);
			if (!confirmed) return;
			await unlinkKnowledge({ sceneId, knowledgeId });
		},
		[sceneId, unlinkKnowledge, t],
	);

	const getTypeColor = useCallback(
		(typeId: string | null) => {
			if (!typeId || !knowledgeTypes) return null;
			const type = knowledgeTypes.find(
				(t: KnowledgeTypeOutline) => t.id === typeId,
			);
			return type?.color ?? null;
		},
		[knowledgeTypes],
	);

	const getTypeName = useCallback(
		(typeId: string | null) => {
			if (!typeId || !knowledgeTypes) return null;
			const type = knowledgeTypes.find(
				(t: KnowledgeTypeOutline) => t.id === typeId,
			);
			return type?.name ?? null;
		},
		[knowledgeTypes],
	);

	return (
		<div className={styles.panel}>
			<div className={styles.toolbar}>
				<span className={styles.toolbarTitle}>
					{t("inspector.relatedMaterials")}
				</span>
				<IconButton
					variant="ghost"
					aria-label={t("inspector.relatedKnowledge.addMaterial")}
					onClick={() => setIsPickerOpen(true)}
				>
					<Plus width={14} height={14} />
				</IconButton>
			</div>

			{sceneKnowledge.length === 0 ? (
				<div className={styles.emptyState}>
					<BookStack width={32} height={32} className={styles.emptyIcon} />
					<p className={styles.emptyText}>
						{t("inspector.relatedKnowledge.noRelated")}
					</p>
					<button
						type="button"
						className={styles.emptyAction}
						onClick={() => setIsPickerOpen(true)}
					>
						<Plus width={14} height={14} />
						{t("inspector.relatedKnowledge.linkMaterial")}
					</button>
				</div>
			) : (
				<div className={styles.list}>
					{sceneKnowledge.map((knowledge) => (
						<div key={knowledge.id} className={styles.item}>
							<KnowledgeExpandable
								knowledgeId={knowledge.id}
								typeName={getTypeName(knowledge.type_id)}
								typeColor={getTypeColor(knowledge.type_id)}
								title={knowledge.title}
							/>
							<div className={styles.itemActions}>
								<button
									type="button"
									className={styles.removeButton}
									onClick={() => handleUnlink(knowledge.id, knowledge.title)}
									aria-label={t("inspector.relatedKnowledge.unlinkTitle")}
								>
									<Xmark width={14} height={14} />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			<KnowledgePickerDialog
				open={isPickerOpen}
				onClose={() => setIsPickerOpen(false)}
				sceneId={sceneId}
				workId={workId}
				excludeIds={sceneKnowledge.map((k) => k.id)}
			/>
		</div>
	);
};
