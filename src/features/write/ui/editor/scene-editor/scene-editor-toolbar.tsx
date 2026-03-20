import { useIsJapanese } from "@shared/hooks/use-is-japanese";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnnotationDialog } from "./annotation-dialog";
import { RubyDialog } from "./ruby-dialog";
import styles from "./styles.module.css";

type SceneEditorToolbarProps = {
	editor: Editor | null;
};

export const SceneEditorToolbar = ({ editor }: SceneEditorToolbarProps) => {
	const { t } = useTranslation();
	const isJapanese = useIsJapanese();
	const [isRubyDialogOpen, setIsRubyDialogOpen] = useState(false);
	const [isAnnotationDialogOpen, setIsAnnotationDialogOpen] = useState(false);
	const [editAnnotationId, setEditAnnotationId] = useState<string | null>(null);
	const [editAnnotationComment, setEditAnnotationComment] = useState("");

	const handleRuby = () => {
		if (!editor) return;
		setIsRubyDialogOpen(true);
	};

	const handleEmphasisDot = () => {
		if (!editor) return;
		editor.chain().focus().toggleEmphasisDot().run();
	};

	const handleTateChuYoko = () => {
		if (!editor) return;
		editor.chain().focus().toggleTateChuYoko().run();
	};

	const handleAnnotation = useCallback(() => {
		if (!editor) return;

		const { from, to } = editor.state.selection;
		let existingAnnotation: { id: string; comment: string } | null = null;

		editor.state.doc.nodesBetween(from, to, (node) => {
			if (node.isText && node.marks.length > 0) {
				for (const mark of node.marks) {
					if (mark.type.name === "annotation") {
						existingAnnotation = {
							id: mark.attrs.id,
							comment: mark.attrs.comment || "",
						};
						return false;
					}
				}
			}
		});

		if (existingAnnotation) {
			const ann = existingAnnotation as { id: string; comment: string };
			setEditAnnotationId(ann.id);
			setEditAnnotationComment(ann.comment);
		} else {
			setEditAnnotationId(null);
			setEditAnnotationComment("");
		}
		setIsAnnotationDialogOpen(true);
	}, [editor]);

	const handleAnnotationDialogClose = useCallback(() => {
		setIsAnnotationDialogOpen(false);
		setEditAnnotationId(null);
		setEditAnnotationComment("");
	}, []);

	if (!editor) {
		return null;
	}

	const shouldShow = ({ from, to }: { from: number; to: number }) => {
		return from !== to;
	};

	return (
		<>
			<BubbleMenu
				editor={editor}
				className={styles.bubbleMenu}
				shouldShow={shouldShow}
				options={{
					placement: "top",
					offset: { mainAxis: 6 },
				}}
			>
				{isJapanese && (
					<>
						<button
							type="button"
							className={styles.bubbleButton}
							onClick={handleRuby}
						>
							{t("write.toolbar.ruby")}
						</button>
						<button
							type="button"
							className={`${styles.bubbleButton} ${editor.isActive("emphasisDot") ? styles.bubbleButtonActive : ""}`}
							onClick={handleEmphasisDot}
						>
							{t("write.toolbar.emphasisDot")}
						</button>
						<button
							type="button"
							className={`${styles.bubbleButton} ${editor.isActive("tateChuYoko") ? styles.bubbleButtonActive : ""}`}
							onClick={handleTateChuYoko}
						>
							{t("write.toolbar.tateChuYoko")}
						</button>
						<div className={styles.bubbleDivider} />
					</>
				)}
				<button
					type="button"
					className={`${styles.bubbleButton} ${editor.isActive("annotation") ? styles.bubbleButtonActive : ""}`}
					onClick={handleAnnotation}
				>
					{t("write.toolbar.comment")}
				</button>
			</BubbleMenu>
			<RubyDialog
				editor={editor}
				isOpen={isRubyDialogOpen}
				onClose={() => setIsRubyDialogOpen(false)}
			/>
			<AnnotationDialog
				editor={editor}
				isOpen={isAnnotationDialogOpen}
				onClose={handleAnnotationDialogClose}
				editAnnotationId={editAnnotationId}
				editComment={editAnnotationComment}
			/>
		</>
	);
};
