import { selectedNodeAtom } from "@features/work";
import { useIMESafeEnter } from "@shared/hooks/use-ime-safe-enter";
import { useToast } from "@shared/lib/toast";
import { Input } from "@shared/ui/input";
import { Page } from "iconoir-react";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { createChapter, createScene } from "../../../model/editor";
import {
	addChapterAtom,
	addingNodeAtom,
	addSceneAtom,
	chapterToExpandAtom,
	editingNodeIdAtom,
} from "../../../model/outline/store";
import styles from "./styles.module.css";

type Props = {
	type: "chapter" | "scene";
	workId: string;
	chapterId?: string;
};

export const AddNodeInput = ({ type, workId, chapterId }: Props) => {
	const { t } = useTranslation();
	const [value, setValue] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const isSubmittingRef = useRef(false);
	const isReadyRef = useRef(false);
	const { showError } = useToast();

	const setAddingNode = useSetAtom(addingNodeAtom);
	const addChapter = useSetAtom(addChapterAtom);
	const addScene = useSetAtom(addSceneAtom);
	const setSelectedNode = useSetAtom(selectedNodeAtom);
	const setEditingNodeId = useSetAtom(editingNodeIdAtom);
	const setChapterToExpand = useSetAtom(chapterToExpandAtom);

	useEffect(() => {
		requestAnimationFrame(() => {
			inputRef.current?.focus();
			isReadyRef.current = true;
		});
	}, []);

	const handleSubmit = useCallback(async () => {
		if (isSubmittingRef.current) return;

		const trimmed = value.trim();
		if (!trimmed) {
			setAddingNode(null);
			return;
		}

		isSubmittingRef.current = true;

		try {
			if (type === "chapter") {
				const result = await createChapter(workId, trimmed);
				if (!result.ok) {
					showError(t("outline.chapterCreateFailed"));
					return;
				}
				const newChapter = result.value;
				addChapter(newChapter);
				setSelectedNode({ id: newChapter.id, type: "chapter" });
				setEditingNodeId(null);
			} else {
				if (!chapterId) return;
				const result = await createScene(chapterId, trimmed);
				if (!result.ok) {
					showError(t("outline.sceneCreateFailed"));
					return;
				}
				const newScene = result.value;
				addScene(newScene);
				setChapterToExpand(chapterId);
				setSelectedNode({ id: newScene.id, type: "scene" });
				setEditingNodeId(null);
			}
			setAddingNode(null);
		} finally {
			isSubmittingRef.current = false;
		}
	}, [
		value,
		type,
		workId,
		chapterId,
		setAddingNode,
		addChapter,
		addScene,
		setSelectedNode,
		setEditingNodeId,
		setChapterToExpand,
		showError,
		t,
	]);

	const handleCancel = useCallback(() => {
		setAddingNode(null);
	}, [setAddingNode]);

	const { handleKeyDown, handleCompositionStart, handleCompositionEnd } =
		useIMESafeEnter({
			onEnter: () => void handleSubmit(),
			onEscape: handleCancel,
		});

	const handleBlur = useCallback(() => {
		if (!isReadyRef.current) return;
		void handleSubmit();
	}, [handleSubmit]);

	return (
		<div className={styles.root}>
			{type === "scene" && (
				<span className={styles.icon}>
					<Page />
				</span>
			)}
			<Input
				ref={inputRef}
				type="text"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={handleKeyDown}
				onBlur={handleBlur}
				onCompositionStart={handleCompositionStart}
				onCompositionEnd={handleCompositionEnd}
				inputSize="sm"
				className={styles.input}
			/>
		</div>
	);
};
