import { EditorContent } from "@tiptap/react";
import clsx from "clsx";
import { useRef } from "react";
import type {
	ManuscriptEditorChangeValue,
	ManuscriptSceneData,
} from "../../../model/manuscript/types";
import { useEditorClasses } from "../hooks/use-editor-classes";
import { useVerticalScrolling } from "../hooks/use-vertical-scrolling";
import { VerticalPreviewBanner } from "../vertical-preview-banner";
import styles from "./styles.module.css";
import { useManuscriptEditor } from "./use-manuscript-editor";

type Props = {
	scenes: ManuscriptSceneData[];
	onChange: (value: ManuscriptEditorChangeValue) => void;
	onSave: () => void;
};

export const ManuscriptEditor = ({ scenes, onChange, onSave }: Props) => {
	const { editor, isVertical, editorSettings } = useManuscriptEditor({
		scenes,
		onChange,
		onSave,
	});
	const containerRef = useRef<HTMLDivElement>(null);

	useVerticalScrolling({ panelRef: containerRef, isVertical });

	const editorClasses = useEditorClasses({
		isVertical,
		editorSettings,
		verticalClassName: styles.vertical,
		additionalBaseClasses: [styles.editor],
	});

	if (!editor) {
		return null;
	}

	return (
		<>
			<VerticalPreviewBanner isVertical={isVertical} />
			<div
				ref={containerRef}
				className={clsx(
					styles.container,
					isVertical && styles.verticalContainer,
				)}
			>
				<EditorContent editor={editor} className={editorClasses} />
			</div>
		</>
	);
};
