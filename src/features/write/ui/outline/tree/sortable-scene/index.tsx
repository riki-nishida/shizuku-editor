import { buildDndId } from "@shared/lib/dnd";
import { SortableNodeWrapper } from "@shared/ui/sidebar-node";
import { Page } from "iconoir-react";
import { useDragState } from "../../../../model/outline/hooks/use-drag-state";
import { BaseNode } from "../outline-node";

type Props = {
	sceneId: string;
	title: string;
};

export const SortableScene = ({ sceneId, title }: Props) => {
	const { isDraggingChapter } = useDragState();

	return (
		<SortableNodeWrapper
			sortableId={buildDndId("scene", sceneId)}
			disableIndicator={isDraggingChapter}
		>
			<BaseNode id={sceneId} title={title} type="scene" icon={<Page />} />
		</SortableNodeWrapper>
	);
};
