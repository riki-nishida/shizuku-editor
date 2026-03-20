import {
	Dialog as ArkDialog,
	type DialogRootProps,
	type DialogRootProviderProps,
	useDialog,
} from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import clsx from "clsx";
import { Xmark } from "iconoir-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

type RootProps = DialogRootProviderProps;

const Root = (props: RootProps) => {
	return <ArkDialog.RootProvider {...props} />;
};

type ControlledRootProps = DialogRootProps;

const ControlledRoot = (props: ControlledRootProps) => {
	return <ArkDialog.Root {...props} />;
};

type FrameProps = {
	open: boolean;
	children: ReactNode;
};

const Frame = ({ open, children }: FrameProps) => {
	return (
		<Portal>
			{open && (
				<>
					<ArkDialog.Backdrop className={styles.backdrop} />
					<ArkDialog.Positioner className={styles.positioner}>
						{children}
					</ArkDialog.Positioner>
				</>
			)}
		</Portal>
	);
};

const Content = ({
	className,
	...props
}: React.ComponentProps<typeof ArkDialog.Content>) => {
	return (
		<ArkDialog.Content className={clsx(styles.content, className)} {...props} />
	);
};

const Trigger = (props: React.ComponentProps<typeof ArkDialog.Trigger>) => {
	return <ArkDialog.Trigger {...props} />;
};

const Title = (props: React.ComponentProps<typeof ArkDialog.Title>) => {
	return <ArkDialog.Title className={styles.title} {...props} />;
};

const CloseTrigger = (
	props: React.ComponentProps<typeof ArkDialog.CloseTrigger>,
) => {
	return <ArkDialog.CloseTrigger className={styles.closeButton} {...props} />;
};

type HeaderProps = {
	title: string;
	onClose?: () => void;
};

const Header = ({ title, onClose }: HeaderProps) => {
	const { t } = useTranslation();
	return (
		<div className={styles.header}>
			<ArkDialog.Title className={styles.title}>{title}</ArkDialog.Title>
			<ArkDialog.CloseTrigger
				className={styles.closeButton}
				onClick={onClose}
				aria-label={t("common.close")}
			>
				<Xmark width={16} height={16} />
			</ArkDialog.CloseTrigger>
		</div>
	);
};

const Backdrop = (props: React.ComponentProps<typeof ArkDialog.Backdrop>) => {
	return <ArkDialog.Backdrop className={styles.backdrop} {...props} />;
};

const Positioner = (
	props: React.ComponentProps<typeof ArkDialog.Positioner>,
) => {
	return <ArkDialog.Positioner className={styles.positioner} {...props} />;
};

export const Dialog = {
	Root,
	ControlledRoot,
	Frame,
	Backdrop,
	Positioner,
	Content,
	Trigger,
	Title,
	CloseTrigger,
	Header,
};

export { useDialog };
