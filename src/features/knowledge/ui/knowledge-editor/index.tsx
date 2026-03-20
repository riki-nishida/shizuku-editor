import {
	type Knowledge,
	newlyCreatedKnowledgeIdAtom,
} from "@features/knowledge/model";
import { useIMESafeEnter } from "@shared/hooks/use-ime-safe-enter";
import { Input } from "@shared/ui/input";
import { EditorContent } from "@tiptap/react";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";
import { useBodyEditor } from "./use-body-editor";
import { useKnowledgeHeader } from "./use-knowledge-header";
import { useKnowledgeTipTapEditor } from "./use-tiptap-editor";

type KnowledgeEditorProps = {
	knowledgeId?: string;
};

export const KnowledgeEditor = ({ knowledgeId }: KnowledgeEditorProps = {}) => {
	const { t } = useTranslation();
	const { knowledge, handlers } = useKnowledgeHeader({ knowledgeId });

	if (!knowledge) {
		return (
			<section className={styles.container}>
				<div className={styles.empty}>{t("knowledge.selectMaterial")}</div>
			</section>
		);
	}

	return (
		<KnowledgeEditorContent
			key={knowledge.id}
			knowledge={knowledge}
			handlers={handlers}
		/>
	);
};

type Props = {
	knowledge: Knowledge;
	handlers: ReturnType<typeof useKnowledgeHeader>["handlers"];
};

function KnowledgeEditorContent({ knowledge, handlers }: Props) {
	const { t } = useTranslation();
	const { draftBody, handleBodyChange, handleSave } = useBodyEditor(knowledge);

	const newlyCreatedKnowledgeId = useAtomValue(newlyCreatedKnowledgeIdAtom);
	const setNewlyCreatedKnowledgeId = useSetAtom(newlyCreatedKnowledgeIdAtom);

	const editor = useKnowledgeTipTapEditor({
		value: draftBody,
		onChange: handleBodyChange,
		onSave: () => void handleSave(),
	});

	useEffect(() => {
		if (
			newlyCreatedKnowledgeId === knowledge.id &&
			editor &&
			!editor.isDestroyed
		) {
			editor.commands.focus();
			setNewlyCreatedKnowledgeId(null);
		}
	}, [
		newlyCreatedKnowledgeId,
		knowledge.id,
		editor,
		setNewlyCreatedKnowledgeId,
	]);

	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [titleDraft, setTitleDraft] = useState(knowledge.title);
	const titleInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setTitleDraft(knowledge.title);
	}, [knowledge.title]);

	useEffect(() => {
		if (isEditingTitle && titleInputRef.current) {
			titleInputRef.current.focus();
			titleInputRef.current.select();
		}
	}, [isEditingTitle]);

	const handleTitleSubmit = useCallback(async () => {
		const trimmed = titleDraft.trim();
		if (trimmed !== knowledge.title) {
			await handlers.titleChange(trimmed);
		}
		setIsEditingTitle(false);
	}, [titleDraft, knowledge.title, handlers]);

	const handleTitleCancel = useCallback(() => {
		setTitleDraft(knowledge.title);
		setIsEditingTitle(false);
	}, [knowledge.title]);

	const {
		handleKeyDown: handleTitleKeyDown,
		handleCompositionStart,
		handleCompositionEnd,
	} = useIMESafeEnter({
		onEnter: () => void handleTitleSubmit(),
		onEscape: handleTitleCancel,
	});

	return (
		<section className={styles.container}>
			<div className={styles.header}>
				<div className={styles.titleWrapper}>
					{isEditingTitle ? (
						<Input
							ref={titleInputRef}
							type="text"
							value={titleDraft}
							onChange={(e) => setTitleDraft(e.target.value)}
							onKeyDown={handleTitleKeyDown}
							onBlur={() => void handleTitleSubmit()}
							onCompositionStart={handleCompositionStart}
							onCompositionEnd={handleCompositionEnd}
							className={styles.titleInput}
						/>
					) : (
						<button
							type="button"
							className={styles.titleButton}
							onClick={() => setIsEditingTitle(true)}
							title={t("common.clickToEdit")}
						>
							{knowledge.title || t("knowledge.untitled")}
						</button>
					)}
				</div>
			</div>
			<div className={styles.editorWrapper}>
				<EditorContent
					editor={editor}
					className={`${styles.tiptapEditor} knowledge-editor`}
				/>
			</div>
		</section>
	);
}
