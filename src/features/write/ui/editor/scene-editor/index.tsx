import { searchPanelOpenAtom } from "@shared/store";
import { EditorContent } from "@tiptap/react";
import clsx from "clsx";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import type {
	ContentMarkup,
	EditorChangeValue,
} from "../../../model/editor/types";
import { editorJumpTargetAtom } from "../../../model/search/store";
import { useCustomCaret } from "../hooks/use-custom-caret";
import { useEditorClasses } from "../hooks/use-editor-classes";
import { useEditorStyle } from "../hooks/use-editor-style";
import { useVerticalArrowKeys } from "../hooks/use-vertical-arrow-keys";
import { useVerticalScrolling } from "../hooks/use-vertical-scrolling";
import { VerticalPreviewBanner } from "../vertical-preview-banner";
import { SceneEditorToolbar } from "./scene-editor-toolbar";
import { SearchPanel } from "./search-panel";
import styles from "./styles.module.css";
import { useSceneEditor } from "./use-scene-editor";

type SceneEditorProps = {
	sceneId: string;
	contentText: string;
	contentMarkups: ContentMarkup[];
	onChange: (value: EditorChangeValue) => void;
	onSave: () => void;
	onSnapshot?: () => void;

	isActive?: boolean;
};

export const SceneEditor = ({
	sceneId,
	contentText,
	contentMarkups,
	onChange,
	onSave,
	onSnapshot,
	isActive = true,
}: SceneEditorProps) => {
	const { editor, isVertical, editorSettings } = useSceneEditor({
		contentText,
		contentMarkups,
		onChange,
		onSave,
		onSnapshot,
	});
	const [isSearchOpen, setIsSearchOpen] = useAtom(searchPanelOpenAtom);
	const [jumpTarget, setJumpTarget] = useAtom(editorJumpTargetAtom);
	const [searchFocusKey, setSearchFocusKey] = useState(0);
	const [initialSearchTerm, setInitialSearchTerm] = useState("");
	const panelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "f") {
				e.preventDefault();

				const selectedText = editor?.state.selection.empty
					? ""
					: editor?.state.doc.textBetween(
							editor.state.selection.from,
							editor.state.selection.to,
						) || "";
				setInitialSearchTerm(selectedText);
				setIsSearchOpen(true);

				setSearchFocusKey((prev) => prev + 1);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [editor, setIsSearchOpen]);

	useEffect(() => {
		if (!editor || !jumpTarget) return;

		if (jumpTarget.sceneId !== sceneId) return;

		const rafId = requestAnimationFrame(() => {
			try {
				const { charOffset, length } = jumpTarget;
				const doc = editor.state.doc;

				let textConsumed = 0;
				let pmPos = 0;

				for (let i = 0; i < doc.childCount; i++) {
					if (i > 0) textConsumed += 1;

					const block = doc.child(i);
					const blockTextLen = block.textContent.length;

					if (textConsumed + blockTextLen >= charOffset) {
						pmPos = pmPos + 1 + (charOffset - textConsumed);
						break;
					}

					textConsumed += blockTextLen;
					pmPos += block.nodeSize;
				}

				const from = Math.min(pmPos, doc.content.size - 1);
				const to = Math.min(from + length, doc.content.size - 1);

				editor.commands.setTextSelection({ from, to });
				editor.commands.scrollIntoView();
				editor.commands.focus();
			} catch {
			} finally {
				setJumpTarget(null);
			}
		});

		return () => cancelAnimationFrame(rafId);
	}, [editor, jumpTarget, setJumpTarget, sceneId]);

	const editorStyle = useEditorStyle(editorSettings);

	useVerticalScrolling({ panelRef, isVertical });
	useCustomCaret(editor, isVertical);
	useVerticalArrowKeys(editor, isVertical);

	const editorClasses = useEditorClasses({
		isVertical,
		editorSettings,
		verticalClassName: styles.vertical,
		additionalBaseClasses: [styles.documentBody, "tiptap-editor"],
	});

	return (
		<>
			<VerticalPreviewBanner isVertical={isVertical} />
			<div className={styles.documentPanelContainer}>
				<div
					ref={panelRef}
					className={clsx(
						styles.documentPanel,
						isVertical && styles.verticalPanel,
					)}
				>
					<div
						className={clsx(
							styles.editorWrapper,
							isVertical && styles.verticalWrapper,
						)}
					>
						<EditorContent
							editor={editor}
							className={editorClasses}
							style={editorStyle}
						/>
						<SceneEditorToolbar editor={editor} />
					</div>
				</div>
				<SearchPanel
					editor={editor}
					isOpen={isSearchOpen && isActive}
					onClose={() => setIsSearchOpen(false)}
					focusKey={searchFocusKey}
					initialSearchTerm={initialSearchTerm}
					isVertical={isVertical}
				/>
			</div>
		</>
	);
};
