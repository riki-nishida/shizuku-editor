import {
	deleteKnowledgeAtom,
	editingKnowledgeIdAtom,
	type KnowledgeOutline,
	knowledgeTypesAtom,
	selectedTypeIdAtom,
	updateKnowledgeInListAtom,
	updateKnowledgeTitleInListAtom,
	updateKnowledgeTypeId,
} from "@features/knowledge/model";
import { selectedNodeAtom } from "@features/work";
import { useInlineRename } from "@shared/hooks/use-inline-rename";
import { showConfirmDialog } from "@shared/lib/dialog";
import { useToast } from "@shared/lib/toast";
import { Input } from "@shared/ui/input";
import { SidebarNode, SortableNodeWrapper } from "@shared/ui/sidebar-node";
import { EditPencil, Folder, Trash } from "iconoir-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TypeIcon } from "../../type-icon";
import styles from "./styles.module.css";

type Props = {
	knowledge: KnowledgeOutline;
	searchQuery?: string;
	matchedText?: string;
};

type SortableProps = Props & {
	sortableId: string;
};

export const SortableKnowledgeListItem = ({
	knowledge,
	sortableId,
	searchQuery,
	matchedText,
}: SortableProps) => {
	return (
		<SortableNodeWrapper sortableId={sortableId}>
			<KnowledgeListItem
				knowledge={knowledge}
				searchQuery={searchQuery}
				matchedText={matchedText}
			/>
		</SortableNodeWrapper>
	);
};

const highlightText = (text: string, query: string) => {
	if (!query.trim()) return text;

	const regex = new RegExp(
		`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
		"gi",
	);
	const parts = text.split(regex);

	return parts.map((part, i) =>
		regex.test(part) ? (
			<mark key={i} className={styles.highlight}>
				{part}
			</mark>
		) : (
			part
		),
	);
};

export const KnowledgeListItem = ({
	knowledge,
	searchQuery,
	matchedText,
}: Props) => {
	const { t } = useTranslation();
	const { showError } = useToast();
	const selectedNode = useAtomValue(selectedNodeAtom);
	const setSelectedNode = useSetAtom(selectedNodeAtom);
	const selectedKnowledgeId =
		selectedNode?.type === "knowledge" ? selectedNode.id : null;
	const onDelete = useSetAtom(deleteKnowledgeAtom);
	const editingKnowledgeId = useAtomValue(editingKnowledgeIdAtom);
	const setEditingKnowledgeId = useSetAtom(editingKnowledgeIdAtom);
	const updateTitle = useSetAtom(updateKnowledgeTitleInListAtom);
	const types = useAtomValue(knowledgeTypesAtom);
	const updateKnowledgeInList = useSetAtom(updateKnowledgeInListAtom);
	const [selectedTypeId, setSelectedTypeId] = useAtom(selectedTypeIdAtom);

	const isActive = selectedKnowledgeId === knowledge.id;
	const isEditing = editingKnowledgeId === knowledge.id;

	const sortedTypes = useMemo(
		() => (types ? [...types].sort((a, b) => a.sort_order - b.sort_order) : []),
		[types],
	);

	const handleRenameSubmit = useCallback(
		async (newTitle: string) => {
			const result = await updateTitle({
				knowledgeId: knowledge.id,
				title: newTitle,
			});
			if (!result.ok) {
				showError(t("knowledge.renameFailed"));
			}
			setEditingKnowledgeId(null);
		},
		[knowledge.id, updateTitle, setEditingKnowledgeId, showError, t],
	);

	const handleRenameCancel = useCallback(() => {
		setEditingKnowledgeId(null);
	}, [setEditingKnowledgeId]);

	const { inputProps } = useInlineRename({
		initialValue: knowledge.title,
		isEditing,
		onSubmit: handleRenameSubmit,
		onCancel: handleRenameCancel,
	});

	const handleClick = useCallback(() => {
		if (isActive) return;
		setSelectedNode({ type: "knowledge", id: knowledge.id });
	}, [isActive, setSelectedNode, knowledge.id]);

	const handleDelete = useCallback(async () => {
		const title = knowledge.title || t("knowledge.untitled");
		const confirmed = await showConfirmDialog(
			t("knowledge.deleteConfirm", { title }),
			{ title: t("knowledge.deleteTitle") },
		);

		if (!confirmed) return;

		const result = await onDelete(knowledge.id);
		if (result.ok && isActive) {
			setSelectedNode(null);
		}
	}, [knowledge.id, knowledge.title, onDelete, isActive, setSelectedNode, t]);

	const handleTypeChange = useCallback(
		async (typeId: string) => {
			const result = await updateKnowledgeTypeId(knowledge.id, typeId);
			if (result.ok) {
				updateKnowledgeInList({ id: knowledge.id, type_id: typeId });
				if (isActive && selectedTypeId !== null && typeId !== selectedTypeId) {
					setSelectedTypeId(typeId);
				}
			} else {
				showError(t("knowledge.categoryChangeFailed"));
			}
		},
		[
			knowledge.id,
			updateKnowledgeInList,
			showError,
			isActive,
			selectedTypeId,
			setSelectedTypeId,
			t,
		],
	);

	const contextMenuItems = useMemo(
		() => [
			{
				value: "rename",
				label: t("common.rename"),
				icon: <EditPencil width={16} height={16} />,
			},
			{
				value: "change-type",
				label: t("knowledge.changeCategory"),
				icon: <Folder width={16} height={16} />,
				children: sortedTypes.map((type) => ({
					value: `type-${type.id}`,
					label: type.name,
					icon: (
						<TypeIcon name={type.name} color={type.color} icon={type.icon} />
					),
					checked: knowledge.type_id === type.id,
				})),
			},
			{ value: "separator-1", label: "", separator: true },
			{
				value: "delete",
				label: t("common.delete"),
				icon: <Trash width={16} height={16} />,
				destructive: true,
			},
		],
		[sortedTypes, knowledge.type_id, t],
	);

	const handleContextMenuSelect = useCallback(
		(details: { value: string }) => {
			if (details.value === "rename") {
				setEditingKnowledgeId(knowledge.id);
			} else if (details.value.startsWith("type-")) {
				const typeId = details.value.slice(5);
				void handleTypeChange(typeId);
			} else if (details.value === "delete") {
				void handleDelete();
			}
		},
		[knowledge.id, setEditingKnowledgeId, handleTypeChange, handleDelete],
	);

	const displayTitle = knowledge.title || t("knowledge.untitled");

	return (
		<SidebarNode
			isActive={isActive}
			onClick={handleClick}
			contextMenuItems={contextMenuItems}
			onContextMenuSelect={handleContextMenuSelect}
			title={
				searchQuery ? highlightText(displayTitle, searchQuery) : displayTitle
			}
			editingContent={
				isEditing ? <Input {...inputProps} inputSize="sm" /> : undefined
			}
			subtitle={
				searchQuery && matchedText ? (
					<span className={styles.preview}>
						{highlightText(matchedText, searchQuery)}
					</span>
				) : undefined
			}
		/>
	);
};
