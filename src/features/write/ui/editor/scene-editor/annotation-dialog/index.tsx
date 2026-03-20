import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

type AnnotationDialogProps = {
	editor: Editor | null;
	isOpen: boolean;
	onClose: () => void;
	editAnnotationId?: string | null;
	editComment?: string;
};

export const AnnotationDialog = ({
	editor,
	isOpen,
	onClose,
	editAnnotationId,
	editComment,
}: AnnotationDialogProps) => {
	const { t } = useTranslation();
	const [comment, setComment] = useState("");
	const [selectedText, setSelectedText] = useState("");
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const isEditMode = !!editAnnotationId;

	const resetAndClose = useCallback(() => {
		setComment("");
		setSelectedText("");
		onClose();
	}, [onClose]);

	useEffect(() => {
		if (isOpen && editor) {
			const { from, to } = editor.state.selection;
			const text = editor.state.doc.textBetween(from, to, "");
			setSelectedText(text);
			setComment(editComment || "");

			const coords = editor.view.coordsAtPos(from);
			setPosition({
				top: coords.bottom + 6,
				left: Math.max(
					12,
					Math.min(coords.left - 100, window.innerWidth - 240),
				),
			});

			setTimeout(() => {
				textareaRef.current?.focus();
				textareaRef.current?.select();
			}, 50);
		}
	}, [isOpen, editor, editComment]);

	const handleSubmit = useCallback(() => {
		if (!editor || !comment.trim()) return;

		if (isEditMode && editAnnotationId) {
			editor
				.chain()
				.focus()
				.updateAnnotationComment(editAnnotationId, comment.trim())
				.run();
		} else {
			const id = crypto.randomUUID();
			editor
				.chain()
				.focus()
				.setAnnotation({ id, comment: comment.trim() })
				.run();
		}
		resetAndClose();
	}, [editor, comment, isEditMode, editAnnotationId, resetAndClose]);

	const handleRemove = useCallback(() => {
		if (!editor || !isEditMode || !editAnnotationId) return;
		editor.chain().focus().removeAnnotationById(editAnnotationId).run();
		resetAndClose();
	}, [editor, isEditMode, editAnnotationId, resetAndClose]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				resetAndClose();
			}
			if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				handleSubmit();
			}
		},
		[resetAndClose, handleSubmit],
	);

	if (!isOpen) return null;

	const truncatedText =
		selectedText.length > 30 ? `${selectedText.slice(0, 30)}...` : selectedText;

	return (
		<>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: Backdrop */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: Keyboard handled */}
			<div className={styles.backdrop} onClick={resetAndClose} />

			<div
				className={styles.popover}
				style={{ top: position.top, left: position.left }}
				role="dialog"
				aria-modal="true"
				onKeyDown={handleKeyDown}
			>
				<div className={styles.target}>{truncatedText}</div>
				<textarea
					ref={textareaRef}
					className={styles.textarea}
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					placeholder={t("write.annotationDialog.placeholder")}
					rows={2}
				/>
				<div className={styles.footer}>
					{isEditMode && (
						<button
							type="button"
							className={styles.removeButton}
							onClick={handleRemove}
						>
							{t("write.annotationDialog.delete")}
						</button>
					)}
					<span className={styles.hint}>
						{t("write.annotationDialog.saveHint")}
					</span>
					<button
						type="button"
						className={styles.saveButton}
						onClick={handleSubmit}
						disabled={!comment.trim()}
					>
						{t("write.annotationDialog.save")}
					</button>
				</div>
			</div>
		</>
	);
};
