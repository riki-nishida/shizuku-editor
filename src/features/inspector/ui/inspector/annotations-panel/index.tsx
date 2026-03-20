import { editorInstanceAtom } from "@features/write";
import { showConfirmDialog } from "@shared/lib/dialog";
import { Trash } from "iconoir-react";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

type Annotation = {
	id: string;
	comment: string;
	text: string;
	from: number;
	to: number;
};

export const AnnotationsPanel = () => {
	const { t } = useTranslation();
	const editor = useAtomValue(editorInstanceAtom);
	const [annotations, setAnnotations] = useState<Annotation[]>([]);

	useEffect(() => {
		if (!editor) {
			setAnnotations([]);
			return;
		}

		const updateAnnotations = () => {
			const found: Annotation[] = [];

			editor.state.doc.descendants((node, pos) => {
				if (node.isText && node.marks.length > 0) {
					for (const mark of node.marks) {
						if (mark.type.name === "annotation") {
							found.push({
								id: mark.attrs.id,
								comment: mark.attrs.comment || "",
								text: node.text || "",
								from: pos,
								to: pos + node.nodeSize,
							});
						}
					}
				}
			});

			const uniqueAnnotations = found.reduce<Annotation[]>((acc, ann) => {
				const existing = acc.find((a) => a.id === ann.id);
				if (existing) {
					existing.text += ann.text;
					existing.to = ann.to;
				} else {
					acc.push({ ...ann });
				}
				return acc;
			}, []);

			setAnnotations(uniqueAnnotations);
		};

		updateAnnotations();

		editor.on("update", updateAnnotations);

		return () => {
			editor.off("update", updateAnnotations);
		};
	}, [editor]);

	const handleClick = useCallback(
		(annotation: Annotation) => {
			if (!editor) return;

			editor
				.chain()
				.focus()
				.setTextSelection({ from: annotation.from, to: annotation.to })
				.run();

			const coords = editor.view.coordsAtPos(annotation.from);
			const editorRect = editor.view.dom.getBoundingClientRect();
			const scrollParent =
				editor.view.dom.closest("[data-scroll-container]") ||
				editor.view.dom.parentElement;

			if (scrollParent) {
				const targetY =
					coords.top - editorRect.top + scrollParent.scrollTop - 100;
				scrollParent.scrollTo({
					top: Math.max(0, targetY),
					behavior: "smooth",
				});
			}
		},
		[editor],
	);

	const handleDelete = useCallback(
		async (e: React.MouseEvent, annotation: Annotation) => {
			e.stopPropagation();
			if (!editor) return;

			const confirmed = await showConfirmDialog(
				t("inspector.annotations.deleteConfirm"),
				{ title: t("inspector.annotations.deleteTitle"), kind: "warning" },
			);
			if (!confirmed) return;

			editor.chain().focus().removeAnnotationById(annotation.id).run();
		},
		[editor, t],
	);

	if (annotations.length === 0) {
		return (
			<div className={styles.emptyState}>
				<span className={styles.emptyText}>
					{t("inspector.annotations.noComments")}
				</span>
			</div>
		);
	}

	return (
		<div className={styles.list}>
			{annotations.map((annotation) => (
				<div key={annotation.id} className={styles.item}>
					<button
						type="button"
						className={styles.itemButton}
						onClick={() => handleClick(annotation)}
					>
						<span className={styles.comment}>
							{annotation.comment || t("inspector.annotations.noCommentText")}
						</span>
						<span className={styles.targetText}>{annotation.text}</span>
					</button>
					<button
						type="button"
						className={styles.deleteButton}
						onClick={(e) => handleDelete(e, annotation)}
						aria-label={t("common.delete")}
					>
						<Trash width={12} height={12} />
					</button>
				</div>
			))}
		</div>
	);
};
