import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

type RubyDialogProps = {
	editor: Editor | null;
	isOpen: boolean;
	onClose: () => void;
};

export const RubyDialog = ({ editor, isOpen, onClose }: RubyDialogProps) => {
	const { t } = useTranslation();
	const [rubyText, setRubyText] = useState("");
	const [selectedText, setSelectedText] = useState("");
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const [isEditMode, setIsEditMode] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const resetAndClose = useCallback(() => {
		setRubyText("");
		setSelectedText("");
		setIsEditMode(false);
		onClose();
	}, [onClose]);

	useEffect(() => {
		if (isOpen && editor) {
			const { from, to } = editor.state.selection;
			const text = editor.state.doc.textBetween(from, to, "");
			setSelectedText(text);

			let existingRuby = "";
			editor.state.doc.nodesBetween(from, to, (node) => {
				if (node.isText && node.marks.length > 0) {
					for (const mark of node.marks) {
						if (mark.type.name === "ruby" && mark.attrs.ruby) {
							existingRuby = mark.attrs.ruby;
							return false;
						}
					}
				}
			});

			setRubyText(existingRuby);
			setIsEditMode(!!existingRuby);

			const coords = editor.view.coordsAtPos(from);
			setPosition({
				top: coords.bottom + 6,
				left: Math.max(
					12,
					Math.min(coords.left - 100, window.innerWidth - 240),
				),
			});

			setTimeout(() => {
				inputRef.current?.focus();
				inputRef.current?.select();
			}, 50);
		}
	}, [isOpen, editor]);

	const handleSubmit = useCallback(() => {
		if (!editor || !rubyText.trim()) return;
		editor.chain().focus().setRuby(rubyText.trim()).run();
		resetAndClose();
	}, [editor, rubyText, resetAndClose]);

	const handleRemove = useCallback(() => {
		if (!editor) return;
		editor.chain().focus().unsetRuby().run();
		resetAndClose();
	}, [editor, resetAndClose]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				resetAndClose();
			}
			if (e.key === "Enter") {
				e.preventDefault();
				handleSubmit();
			}
		},
		[resetAndClose, handleSubmit],
	);

	if (!isOpen) return null;

	const truncatedText =
		selectedText.length > 20 ? `${selectedText.slice(0, 20)}...` : selectedText;

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
				<input
					ref={inputRef}
					type="text"
					className={styles.input}
					value={rubyText}
					onChange={(e) => setRubyText(e.target.value)}
					placeholder={t("write.rubyDialog.placeholder")}
				/>
				{rubyText && (
					<div className={styles.preview}>
						<ruby>
							{selectedText}
							<rt>{rubyText}</rt>
						</ruby>
					</div>
				)}
				<div className={styles.footer}>
					{isEditMode && (
						<button
							type="button"
							className={styles.removeButton}
							onClick={handleRemove}
						>
							{t("write.rubyDialog.delete")}
						</button>
					)}
					<span className={styles.hint}>{t("write.rubyDialog.saveHint")}</span>
					<button
						type="button"
						className={styles.saveButton}
						onClick={handleSubmit}
						disabled={!rubyText.trim()}
					>
						{t("write.rubyDialog.save")}
					</button>
				</div>
			</div>
		</>
	);
};
