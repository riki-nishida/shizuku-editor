import { SidebarNode } from "@shared/ui/sidebar-node";
import type { ReactNode } from "react";
import { InlineInput } from "../../inline-input";
import { useOutlineNodeState } from "./use-outline-node-state";

type BaseNodeProps = {
	id: string;
	title: string;
	type: "chapter" | "scene";
	icon: ReactNode;
	className?: string;
	action?: ReactNode;
};

export const BaseNode = ({
	id,
	title,
	type,
	icon,
	className,
	action,
}: BaseNodeProps) => {
	const {
		isActive,
		isEditing,
		select,
		onEditComplete,
		contextMenuItems,
		handleContextMenuSelect,
	} = useOutlineNodeState({ id, type });

	return (
		<SidebarNode
			icon={icon}
			title={title}
			isActive={isActive}
			onClick={select}
			contextMenuItems={contextMenuItems}
			onContextMenuSelect={handleContextMenuSelect}
			variant={type === "scene" ? "leaf" : "branch"}
			action={action}
			className={className}
			editingContent={
				isEditing ? (
					<InlineInput
						nodeId={id}
						nodeType={type}
						initialValue={title}
						onComplete={onEditComplete}
					/>
				) : undefined
			}
		/>
	);
};
