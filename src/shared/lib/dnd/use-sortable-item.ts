import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo } from "react";

type UseSortableItemOptions = {
	id: string;
	disabled?: boolean;
};

type UseSortableItemReturn = {
	setNodeRef: (element: HTMLElement | null) => void;
	attributes: ReturnType<typeof useSortable>["attributes"];
	listeners: ReturnType<typeof useSortable>["listeners"];
	style: {
		transform: string | undefined;
		transition: string | undefined;
		opacity: number;
	};
	isDragging: boolean;
	isSorting: boolean;
	isOver: boolean;
	isBefore: boolean;
	showIndicator: boolean;
	transform: ReturnType<typeof useSortable>["transform"];
};

export const useSortableItem = ({
	id,
	disabled = false,
}: UseSortableItemOptions): UseSortableItemReturn => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
		isSorting,
		isOver,
		activeIndex,
		overIndex,
	} = useSortable({
		id,
		animateLayoutChanges: ({ isSorting }) => !isSorting,
		disabled,
	});

	const canTransform = !isSorting;
	const hasValidIndices = activeIndex !== undefined && overIndex !== undefined;
	const isBefore = hasValidIndices && activeIndex > overIndex;
	const showIndicator = isOver && hasValidIndices && !isDragging;

	const style = useMemo(
		() => ({
			transform: canTransform ? CSS.Transform.toString(transform) : undefined,
			transition,
			opacity: isDragging ? 0.5 : 1,
		}),
		[canTransform, transform, transition, isDragging],
	);

	return {
		setNodeRef,
		attributes,
		listeners,
		style,
		isDragging,
		isSorting,
		isOver,
		isBefore,
		showIndicator,
		transform,
	};
};
