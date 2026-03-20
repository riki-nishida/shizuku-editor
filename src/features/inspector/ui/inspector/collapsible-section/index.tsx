import {
	inspectorSectionsAtom,
	toggleInspectorSectionAtom,
} from "@features/inspector/model";
import { Collapsible } from "@shared/ui/collapsible";
import { NavArrowDown } from "iconoir-react";
import { useAtomValue, useSetAtom } from "jotai";
import type { ReactNode } from "react";
import styles from "./styles.module.css";

type CollapsibleSectionProps = {
	sectionId: string;
	title: string;
	children: ReactNode;
	action?: ReactNode;
};

export const CollapsibleSection = ({
	sectionId,
	title,
	children,
	action,
}: CollapsibleSectionProps) => {
	const sections = useAtomValue(inspectorSectionsAtom);
	const toggleSection = useSetAtom(toggleInspectorSectionAtom);

	const isCollapsed = sections[sectionId] ?? false;

	const handleOpenChange = (details: { open: boolean }) => {
		const currentlyCollapsed = sections[sectionId] ?? false;
		if (details.open === currentlyCollapsed) {
			toggleSection(sectionId);
		}
	};

	return (
		<Collapsible.Root
			open={!isCollapsed}
			onOpenChange={handleOpenChange}
			className={styles.section}
		>
			<Collapsible.Trigger className={styles.headerButton}>
				<Collapsible.Indicator className={styles.iconButton}>
					<NavArrowDown width={14} height={14} />
				</Collapsible.Indicator>
				<span className={styles.title}>{title}</span>
				{action}
			</Collapsible.Trigger>
			<Collapsible.Content className={styles.content}>
				{children}
			</Collapsible.Content>
		</Collapsible.Root>
	);
};
