import {
	Accordion as ArkAccordion,
	type AccordionItemProps as ArkAccordionItemProps,
	type AccordionRootProps as ArkAccordionRootProps,
} from "@ark-ui/react/accordion";
import { NavArrowDown } from "iconoir-react";
import type { ReactNode } from "react";
import styles from "./styles.module.css";

type RootProps = Omit<ArkAccordionRootProps, "className"> & {
	className?: string;
};

const Root = ({ className, ...props }: RootProps) => {
	return (
		<ArkAccordion.Root
			className={`${styles.root} ${className ?? ""}`}
			{...props}
		/>
	);
};

type ItemProps = Omit<ArkAccordionItemProps, "className"> & {
	className?: string;
};

const Item = ({ className, ...props }: ItemProps) => {
	return (
		<ArkAccordion.Item
			className={`${styles.item} ${className ?? ""}`}
			{...props}
		/>
	);
};

type ItemTriggerProps = {
	children: ReactNode;
	onRemove?: () => void;
	removeTooltip?: string;
};

const ItemTrigger = ({ children }: ItemTriggerProps) => {
	return (
		<ArkAccordion.ItemTrigger className={styles.itemTrigger}>
			<span className={styles.itemTriggerContent}>{children}</span>
			<ArkAccordion.ItemIndicator className={styles.itemIndicator}>
				<NavArrowDown width={14} height={14} />
			</ArkAccordion.ItemIndicator>
		</ArkAccordion.ItemTrigger>
	);
};

type ItemContentProps = {
	children: ReactNode;
};

const ItemContent = ({ children }: ItemContentProps) => {
	return (
		<ArkAccordion.ItemContent className={styles.itemContent}>
			<div className={styles.itemContentInner}>{children}</div>
		</ArkAccordion.ItemContent>
	);
};

export const Accordion = {
	Root,
	Item,
	ItemTrigger,
	ItemContent,
};
