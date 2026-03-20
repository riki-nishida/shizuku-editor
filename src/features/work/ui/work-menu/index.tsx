import { loadWorkData } from "@app/lib/work-loader";
import { resetKnowledgeAtom } from "@features/knowledge";
import { selectedNodeAtom, selectedWorkAtom } from "@features/work";
import { loadWorksAtom, workListAtom } from "@features/work/model";
import {
	clearSelectedWorkId,
	deleteWork,
	deleteWorkUiState,
	listWorks,
	saveSelectedWorkId,
	updateWorkName,
} from "@features/work/model/commands";
import type { Work } from "@features/work/model/types";
import { initializeOutlineAtom, selectedSceneAtom } from "@features/write";
import { useInlineInput } from "@shared/hooks/use-inline-input";
import { formatRelativeDate } from "@shared/lib/date";
import { showConfirmDialog } from "@shared/lib/dialog";
import { useToast } from "@shared/lib/toast";
import { Input } from "@shared/ui/input";
import { Menu } from "@shared/ui/menu";
import { Popover } from "@shared/ui/popover";
import { EditPencil, MoreHoriz, Plus, Trash } from "iconoir-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";
import { useCreateWork } from "./use-create-work";

export const WorkMenu = () => {
	const { t } = useTranslation();
	const selectedWork = useAtomValue(selectedWorkAtom);
	const setSelectedWork = useSetAtom(selectedWorkAtom);
	const works = useAtomValue(workListAtom);
	const loadWorks = useSetAtom(loadWorksAtom);

	const setSelectedNode = useSetAtom(selectedNodeAtom);
	const setSelectedScene = useSetAtom(selectedSceneAtom);
	const initializeOutline = useSetAtom(initializeOutlineAtom);
	const resetKnowledge = useSetAtom(resetKnowledgeAtom);

	const [isOpen, setIsOpen] = useState(false);
	const [renamingWorkId, setRenamingWorkId] = useState<string | null>(null);
	const [renameValue, setRenameValue] = useState("");
	const { handleCreateWork } = useCreateWork();
	const { showSuccess, showError } = useToast();

	useEffect(() => {
		void loadWorks();
	}, [loadWorks]);

	const handleOpenChange = useCallback(
		(details: { open: boolean }) => {
			setIsOpen(details.open);
			if (details.open) {
				void loadWorks();
			}
		},
		[loadWorks],
	);

	const handleSelectWork = useCallback(
		async (work: Work) => {
			if (selectedWork?.id === work.id) {
				setIsOpen(false);
				return;
			}

			const data = await loadWorkData(work.id);

			setSelectedScene(null);
			resetKnowledge();
			initializeOutline({
				outline: data.outline,
				expandedChapters: data.expandedChapters,
			});
			setSelectedNode(data.selectedNode);

			setSelectedWork(work);
			void saveSelectedWorkId(work.id);
			setIsOpen(false);
		},
		[
			selectedWork?.id,
			setSelectedWork,
			setSelectedNode,
			setSelectedScene,
			initializeOutline,
			resetKnowledge,
		],
	);

	const handleSubmitWork = useCallback(
		async (name: string) => {
			const newWorkId = await handleCreateWork(name);
			if (newWorkId) {
				const worksResult = await listWorks();
				if (worksResult.ok) {
					const newWork = worksResult.value.find(
						(w: Work) => w.id === newWorkId,
					);
					if (newWork) {
						await handleSelectWork(newWork);
					}
				}
			}
		},
		[handleCreateWork, handleSelectWork],
	);

	const { isAdding, inputProps, startAdd, handleCancel } = useInlineInput({
		onSubmit: handleSubmitWork,
	});

	useEffect(() => {
		if (!isOpen) {
			handleCancel();
			setRenamingWorkId(null);
		}
	}, [isOpen, handleCancel]);

	const handleStartRename = useCallback((work: Work) => {
		setRenamingWorkId(work.id);
		setRenameValue(work.name);
	}, []);

	const handleRenameSubmit = useCallback(async () => {
		if (!renamingWorkId || !renameValue.trim()) {
			setRenamingWorkId(null);
			return;
		}

		const result = await updateWorkName(renamingWorkId, renameValue.trim());
		if (result.ok) {
			await loadWorks();
			if (selectedWork?.id === renamingWorkId) {
				setSelectedWork({ ...selectedWork, name: renameValue.trim() });
			}
		}
		setRenamingWorkId(null);
	}, [renamingWorkId, renameValue, loadWorks, selectedWork, setSelectedWork]);

	const handleRenameKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				void handleRenameSubmit();
			} else if (e.key === "Escape") {
				setRenamingWorkId(null);
			}
		},
		[handleRenameSubmit],
	);

	const handleDeleteWork = useCallback(
		async (work: Work) => {
			const confirmed = await showConfirmDialog(
				t("work.deleteConfirm", { name: work.name }),
				{
					title: t("work.deleteTitle"),
					kind: "warning",
					okLabel: t("work.deleteLabel"),
				},
			);

			if (!confirmed) return;

			const result = await deleteWork(work.id);
			if (result.ok) {
				showSuccess(t("work.deleted"));
				void deleteWorkUiState(work.id);
				if (selectedWork?.id === work.id) {
					const worksResult = await listWorks();
					const remainingWorks = worksResult.ok ? worksResult.value : [];
					const nextWork = remainingWorks.find((w) => w.id !== work.id);
					if (nextWork) {
						await handleSelectWork(nextWork);
					} else {
						void clearSelectedWorkId();
						setSelectedNode(null);
						setSelectedScene(null);
						resetKnowledge();
						initializeOutline({
							outline: { chapters: [], scenes: [] },
							expandedChapters: {},
						});
						setSelectedWork(null);
						setIsOpen(false);
					}
				}
				await loadWorks();
			} else {
				showError(t("work.deleteFailed"));
			}
		},
		[
			selectedWork,
			setSelectedWork,
			setSelectedNode,
			setSelectedScene,
			resetKnowledge,
			initializeOutline,
			handleSelectWork,
			loadWorks,
			showSuccess,
			showError,
			t,
		],
	);

	const selectedWorkName = selectedWork?.name ?? t("work.selectWork");

	return (
		<div className={styles.container}>
			<Popover
				open={isOpen}
				onOpenChange={handleOpenChange}
				trigger={
					<button
						type="button"
						className={styles.trigger}
						onDoubleClick={(e) => e.stopPropagation()}
					>
						<span className={styles.triggerText}>{selectedWorkName}</span>
					</button>
				}
			>
				<div className={styles.popoverContent}>
					<div className={styles.workList}>
						{works.length === 0 && !isAdding ? (
							<p className={styles.emptyList}>{t("work.noWorks")}</p>
						) : (
							[...works]
								.sort((a, b) => {
									if (a.id === selectedWork?.id) return -1;
									if (b.id === selectedWork?.id) return 1;
									return 0;
								})
								.map((work) => {
									const isActive = work.id === selectedWork?.id;
									const isRenaming = renamingWorkId === work.id;

									if (isRenaming) {
										return (
											<div key={work.id} className={styles.inlineInput}>
												<Input
													inputSize="sm"
													value={renameValue}
													onChange={(e) => setRenameValue(e.target.value)}
													onBlur={() => void handleRenameSubmit()}
													onKeyDown={handleRenameKeyDown}
													autoFocus
												/>
											</div>
										);
									}

									return (
										<div
											key={work.id}
											className={styles.workItem}
											data-active={isActive}
										>
											<button
												type="button"
												className={styles.workItemButton}
												onClick={() => void handleSelectWork(work)}
											>
												<span className={styles.workName}>{work.name}</span>
												<span className={styles.workMeta}>
													{formatRelativeDate(work.updated_at)}
												</span>
											</button>
											<Menu
												trigger={
													<button
														type="button"
														className={styles.menuButton}
														onClick={(e) => e.stopPropagation()}
													>
														<MoreHoriz width={16} height={16} />
													</button>
												}
												items={[
													{
														id: "rename",
														label: t("common.rename"),
														icon: <EditPencil width={16} height={16} />,
														onClick: () => handleStartRename(work),
													},
													{
														id: "delete",
														label: t("common.delete"),
														icon: <Trash width={16} height={16} />,
														onClick: () => void handleDeleteWork(work),
														destructive: true,
													},
												]}
											/>
										</div>
									);
								})
						)}
						{isAdding && (
							<div className={styles.inlineInput}>
								<Input
									{...inputProps}
									inputSize="sm"
									placeholder={t("work.newWorkPlaceholder")}
								/>
							</div>
						)}
					</div>

					<div className={styles.divider} />

					<button
						type="button"
						className={styles.addButton}
						onClick={startAdd}
						disabled={isAdding}
					>
						<Plus width={16} height={16} />
						<span>{t("work.newWork")}</span>
					</button>
				</div>
			</Popover>
		</div>
	);
};
