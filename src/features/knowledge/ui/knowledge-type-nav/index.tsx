import { Menu } from "@ark-ui/react/menu";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
	createKnowledgeType,
	deleteKnowledgeType,
	type KnowledgeTypeOutline,
	knowledgeListAtom,
	knowledgeTypesAtom,
	loadKnowledgeAtom,
	loadKnowledgeTypesAtom,
	reloadKnowledgeTypesAtom,
	selectedTypeIdAtom,
	typeCountsAtom,
	updateKnowledgeType,
	updateKnowledgeTypeSortOrder,
} from "@features/knowledge/model";
import { selectedNodeAtom } from "@features/work";
import { useIMESafeEnter } from "@shared/hooks/use-ime-safe-enter";
import { useInlineInput } from "@shared/hooks/use-inline-input";
import { showConfirmDialog } from "@shared/lib/dialog";
import { useDndSensors } from "@shared/lib/dnd";
import { useToast } from "@shared/lib/toast";
import { IconButton } from "@shared/ui/icon-button";
import { Input } from "@shared/ui/input";
import {
	NodeDragOverlay,
	SidebarNode,
	SortableNodeWrapper,
} from "@shared/ui/sidebar-node";
import clsx from "clsx";
import {
	Bookmark,
	Brain,
	Building,
	ChatBubble,
	Clock,
	Crown,
	EditPencil,
	Eye,
	Folder,
	Globe,
	Group,
	Heart,
	Key,
	LightBulb,
	MapPin,
	Palette,
	Plus,
	Star,
	Trash,
	User,
} from "iconoir-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { TypeIcon } from "../type-icon";
import styles from "./styles.module.css";

type Props = {
	workId: string | null;
	showHeader?: boolean;
};

export type KnowledgeTypeNavHandle = {
	startAddType: () => void;
};

const buildSortableId = (id: string) => `type-${id}`;
const parseSortableId = (sortableId: string): string | null => {
	const match = sortableId.match(/^type-(.+)$/);
	return match ? match[1] : null;
};

export const CUSTOM_TYPE_COLORS = [
	"#E57373",
	"#FFB74D",
	"#81C784",
	"#4DB6AC",
	"#64B5F6",
	"#BA68C8",
	"#90A4AE",
] as const;

const CUSTOM_TYPE_ICONS = [
	{ name: "User", component: User },
	{ name: "Group", component: Group },
	{ name: "MapPin", component: MapPin },
	{ name: "Building", component: Building },
	{ name: "Globe", component: Globe },
	{ name: "Clock", component: Clock },
	{ name: "Key", component: Key },
	{ name: "Star", component: Star },
	{ name: "Heart", component: Heart },
	{ name: "Brain", component: Brain },
	{ name: "Eye", component: Eye },
	{ name: "Crown", component: Crown },
	{ name: "LightBulb", component: LightBulb },
	{ name: "Bookmark", component: Bookmark },
	{ name: "ChatBubble", component: ChatBubble },
	{ name: "EditPencil", component: EditPencil },
] as const;

const AppearancePicker = ({
	type,
	onIconChange,
	onColorChange,
}: {
	type: KnowledgeTypeOutline;
	onIconChange: (iconName: string | null) => void;
	onColorChange: (color: string) => void;
}) => (
	<div className={styles.pickerGrid}>
		{CUSTOM_TYPE_ICONS.map((icon) => (
			<Menu.Item
				key={icon.name}
				value={`icon-${icon.name}`}
				className={clsx(
					styles.pickerItem,
					type.icon === icon.name && styles.pickerItemActive,
				)}
				onClick={() => void onIconChange(icon.name)}
			>
				<icon.component width={16} height={16} />
			</Menu.Item>
		))}
		{CUSTOM_TYPE_COLORS.map((color) => (
			<Menu.Item
				key={color}
				value={`color-${color}`}
				className={clsx(
					styles.pickerItem,
					!type.icon && type.color === color && styles.pickerItemActive,
				)}
				onClick={() => void onColorChange(color)}
			>
				<span
					className={styles.colorSwatch}
					style={{ backgroundColor: color }}
				/>
			</Menu.Item>
		))}
	</div>
);

export const KnowledgeTypeNav = forwardRef<KnowledgeTypeNavHandle, Props>(
	({ workId, showHeader = true }, ref) => {
		const { t } = useTranslation();
		const types = useAtomValue(knowledgeTypesAtom);
		const knowledgeList = useAtomValue(knowledgeListAtom);
		const typeCounts = useAtomValue(typeCountsAtom);
		const loadTypes = useSetAtom(loadKnowledgeTypesAtom);
		const loadKnowledge = useSetAtom(loadKnowledgeAtom);
		const setTypes = useSetAtom(knowledgeTypesAtom);
		const [selectedTypeId, setSelectedTypeId] = useAtom(selectedTypeIdAtom);
		const selectedNode = useAtomValue(selectedNodeAtom);
		const setSelectedNode = useSetAtom(selectedNodeAtom);
		const selectedKnowledgeId =
			selectedNode?.type === "knowledge" ? selectedNode.id : null;
		const isKnowledgeMode = selectedNode?.type === "knowledge";
		const { showError } = useToast();

		const handleTypeSelect = useCallback(
			async (newTypeId: string | null) => {
				setSelectedTypeId(newTypeId);

				let list = knowledgeList;
				if (!list && workId) {
					const result = await loadKnowledge(workId);
					if (result.ok) {
						list = result.value;
					} else {
						return;
					}
				}

				if (!list) return;

				if (newTypeId === null) {
					if (selectedKnowledgeId === null) {
						if (list.length > 0) {
							setSelectedNode({ type: "knowledge", id: list[0].id });
						} else {
							setSelectedNode({ type: "knowledge", id: null });
						}
					}
					return;
				}

				const selectedKnowledge = list.find(
					(k) => k.id === selectedKnowledgeId,
				);

				if (!selectedKnowledge || selectedKnowledge.type_id !== newTypeId) {
					const firstInType = list.find((k) => k.type_id === newTypeId);
					if (firstInType) {
						setSelectedNode({ type: "knowledge", id: firstInType.id });
					} else {
						setSelectedNode({ type: "knowledge", id: null });
					}
				}
			},
			[
				setSelectedTypeId,
				setSelectedNode,
				selectedKnowledgeId,
				knowledgeList,
				workId,
				loadKnowledge,
			],
		);

		useEffect(() => {
			if (workId === null || types !== null) return;
			loadTypes(workId);
		}, [workId, types, loadTypes]);

		useEffect(() => {
			if (workId === null || knowledgeList !== null) return;
			loadKnowledge(workId);
		}, [workId, loadKnowledge, knowledgeList]);

		const sortedTypes = useMemo(() => {
			if (!types) return [];
			return [...types].sort((a, b) => a.sort_order - b.sort_order);
		}, [types]);

		const totalCount = knowledgeList?.length ?? 0;

		const {
			isAdding: isAddingType,
			inputProps,
			startAdd,
		} = useInlineInput<string>({
			onSubmit: async (value) => {
				if (workId === null) {
					throw new Error("workId is null");
				}
				const result = await createKnowledgeType(workId, value);
				if (!result.ok) {
					showError(t("knowledge.categoryAddFailed"));
					throw new Error("Failed to add type");
				}
				await loadTypes(workId);
				return result.value;
			},
			onSuccess: (newTypeId) => {
				setSelectedTypeId(newTypeId);
				setSelectedNode(null);
			},
		});

		const handleStartAdd = useCallback(() => {
			if (workId === null) return;
			startAdd();
		}, [workId, startAdd]);

		useImperativeHandle(
			ref,
			() => ({
				startAddType: handleStartAdd,
			}),
			[handleStartAdd],
		);

		const [activeItem, setActiveItem] = useState<KnowledgeTypeOutline | null>(
			null,
		);
		const sensors = useDndSensors();

		const handleDragStart = useCallback(
			(event: DragStartEvent) => {
				const id = parseSortableId(String(event.active.id));
				if (id === null) return;
				const item = sortedTypes.find((t) => t.id === id);
				if (item) setActiveItem(item);
			},
			[sortedTypes],
		);

		const handleDragEnd = useCallback(
			async (event: DragEndEvent) => {
				setActiveItem(null);

				const { active, over } = event;
				if (!over || active.id === over.id || !types) return;

				const activeId = parseSortableId(String(active.id));
				const overId = parseSortableId(String(over.id));
				if (activeId === null || overId === null) return;

				const oldIndex = sortedTypes.findIndex((t) => t.id === activeId);
				const newIndex = sortedTypes.findIndex((t) => t.id === overId);
				if (oldIndex === -1 || newIndex === -1) return;

				const newSortedTypes = arrayMove(sortedTypes, oldIndex, newIndex);
				const updatedTypes = newSortedTypes.map((t, i) => ({
					...t,
					sort_order: i,
				}));
				setTypes(updatedTypes);

				for (let i = 0; i < newSortedTypes.length; i++) {
					if (sortedTypes[i]?.id !== newSortedTypes[i].id) {
						await updateKnowledgeTypeSortOrder(newSortedTypes[i].id, i);
					}
				}
			},
			[types, sortedTypes, setTypes],
		);

		const sortableIds = sortedTypes.map((t) => buildSortableId(t.id));

		return (
			<nav className={styles.root}>
				{showHeader && (
					<header className={styles.header}>
						<h2 className={styles.headerTitle}>{t("knowledge.materials")}</h2>
						<IconButton
							variant="ghost"
							onClick={handleStartAdd}
							disabled={workId === null || isAddingType}
							aria-label={t("knowledge.addCategory")}
						>
							<Plus width={16} height={16} />
						</IconButton>
					</header>
				)}
				<div className={styles.typeList}>
					<SidebarNode
						icon={<Folder width={14} height={14} />}
						title={t("knowledge.all")}
						isActive={isKnowledgeMode && selectedTypeId === null}
						onClick={() => void handleTypeSelect(null)}
						action={<span className={styles.count}>{totalCount}</span>}
						variant="leaf"
					/>

					{sortedTypes.length > 0 && (
						<DndContext
							sensors={sensors}
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
							modifiers={[restrictToVerticalAxis]}
						>
							<SortableContext
								items={sortableIds}
								strategy={verticalListSortingStrategy}
							>
								{sortedTypes.map((type) => (
									<SortableTypeNavItem
										key={type.id}
										type={type}
										workId={workId}
										isSelected={isKnowledgeMode && selectedTypeId === type.id}
										onClick={() => void handleTypeSelect(type.id)}
										sortableId={buildSortableId(type.id)}
										count={typeCounts?.[type.id] ?? 0}
									/>
								))}
							</SortableContext>
							<DragOverlay dropAnimation={null}>
								{activeItem && <NodeDragOverlay title={activeItem.name} />}
							</DragOverlay>
						</DndContext>
					)}

					{isAddingType && (
						<div className={styles.inlineInput}>
							<Input {...inputProps} />
						</div>
					)}
				</div>
			</nav>
		);
	},
);

type TypeNavItemProps = {
	type: KnowledgeTypeOutline;
	workId: string | null;
	isSelected: boolean;
	onClick: () => void;
	count: number;
};

const TypeNavItem = ({
	type,
	workId,
	isSelected,
	onClick,
	count,
}: TypeNavItemProps) => {
	const { t } = useTranslation();
	const { showError } = useToast();
	const reloadTypes = useSetAtom(reloadKnowledgeTypesAtom);
	const loadKnowledge = useSetAtom(loadKnowledgeAtom);
	const selectedNode = useAtomValue(selectedNodeAtom);
	const setSelectedNode = useSetAtom(selectedNodeAtom);
	const knowledgeList = useAtomValue(knowledgeListAtom);
	const setSelectedTypeId = useSetAtom(selectedTypeIdAtom);
	const [isEditing, setIsEditing] = useState(false);
	const [editingName, setEditingName] = useState(type.name);

	const handleUpdate = useCallback(async () => {
		if (!workId || !editingName.trim()) {
			setIsEditing(false);
			return;
		}
		try {
			await updateKnowledgeType(type.id, editingName.trim());
			await reloadTypes(workId);
		} catch {
			showError(t("knowledge.categoryUpdateFailed"));
		}
		setIsEditing(false);
	}, [workId, type.id, editingName, reloadTypes, showError, t]);

	const handleDelete = useCallback(async () => {
		if (!workId) return;

		const confirmed = await showConfirmDialog(
			t("knowledge.categoryDeleteConfirm", { name: type.name }),
			{ title: t("knowledge.categoryDeleteTitle") },
		);

		if (!confirmed) return;

		try {
			await deleteKnowledgeType(type.id);

			if (isSelected) {
				setSelectedTypeId(null);
				setSelectedNode({ type: "knowledge", id: null });
			} else {
				const selectedKnowledgeId =
					selectedNode?.type === "knowledge" ? selectedNode.id : null;
				const selectedBelongsToType =
					selectedKnowledgeId &&
					knowledgeList?.some(
						(k) => k.id === selectedKnowledgeId && k.type_id === type.id,
					);
				if (selectedBelongsToType) {
					setSelectedNode({ type: "knowledge", id: null });
				}
			}

			await reloadTypes(workId);
			await loadKnowledge(workId);
		} catch {
			showError(t("knowledge.categoryDeleteFailed"));
		}
	}, [
		workId,
		type.id,
		type.name,
		isSelected,
		selectedNode,
		knowledgeList,
		reloadTypes,
		loadKnowledge,
		setSelectedNode,
		setSelectedTypeId,
		showError,
		t,
	]);

	const handleColorChange = useCallback(
		async (color: string) => {
			if (!workId) return;
			try {
				await updateKnowledgeType(type.id, undefined, color, "");
				await reloadTypes(workId);
			} catch {
				showError(t("knowledge.colorChangeFailed"));
			}
		},
		[workId, type.id, reloadTypes, showError, t],
	);

	const handleIconChange = useCallback(
		async (iconName: string | null) => {
			if (!workId) return;
			try {
				await updateKnowledgeType(
					type.id,
					undefined,
					undefined,
					iconName ?? "",
				);
				await reloadTypes(workId);
			} catch {
				showError(t("knowledge.iconChangeFailed"));
			}
		},
		[workId, type.id, reloadTypes, showError, t],
	);

	const { handleKeyDown, handleCompositionStart, handleCompositionEnd } =
		useIMESafeEnter({
			onEnter: () => void handleUpdate(),
			onEscape: () => setIsEditing(false),
		});

	const contextMenuItems = useMemo(
		() => [
			{
				value: "rename",
				label: t("common.rename"),
				icon: <EditPencil width={16} height={16} />,
			},
			{
				value: "appearance",
				label: t("knowledge.changeIcon"),
				icon: <Palette width={16} height={16} />,
				customContent: (
					<AppearancePicker
						type={type}
						onIconChange={(name) => void handleIconChange(name)}
						onColorChange={(color) => void handleColorChange(color)}
					/>
				),
				customContentClassName: styles.appearancePicker,
			},
			{ value: "sep", label: "", separator: true },
			{
				value: "delete",
				label: t("common.delete"),
				icon: <Trash width={16} height={16} />,
				destructive: true,
			},
		],
		[type, handleIconChange, handleColorChange, t],
	);

	const handleContextMenuSelect = useCallback(
		(details: { value: string }) => {
			if (details.value === "rename") {
				setEditingName(type.name);
				setIsEditing(true);
			} else if (details.value === "delete") {
				void handleDelete();
			}
		},
		[type.name, handleDelete],
	);

	return (
		<SidebarNode
			icon={<TypeIcon name={type.name} color={type.color} icon={type.icon} />}
			title={type.name}
			isActive={isSelected}
			onClick={onClick}
			contextMenuItems={contextMenuItems}
			onContextMenuSelect={handleContextMenuSelect}
			action={<span className={styles.count}>{count}</span>}
			variant="leaf"
			editingContent={
				isEditing ? (
					<Input
						value={editingName}
						onChange={(e) => setEditingName(e.target.value)}
						onKeyDown={handleKeyDown}
						onCompositionStart={handleCompositionStart}
						onCompositionEnd={handleCompositionEnd}
						onBlur={() => void handleUpdate()}
						autoFocus
						inputSize="sm"
					/>
				) : undefined
			}
		/>
	);
};

type SortableTypeNavItemProps = TypeNavItemProps & {
	sortableId: string;
};

const SortableTypeNavItem = ({
	sortableId,
	...props
}: SortableTypeNavItemProps) => (
	<SortableNodeWrapper sortableId={sortableId}>
		<TypeNavItem {...props} />
	</SortableNodeWrapper>
);
