import { useIMESafeEnter } from "@shared/hooks/use-ime-safe-enter";
import { useToast } from "@shared/lib/toast";
import { Input } from "@shared/ui/input";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { updateChapterTitle, updateSceneTitle } from "../../../model/editor";
import {
	updateChapterTitleAtom,
	updateSceneTitleAtom,
} from "../../../model/outline/store";

type Props = {
	nodeId: string;
	nodeType: "chapter" | "scene";
	initialValue: string;
	onComplete?: () => void;
	inputClassName?: string;
};

export const InlineInput = ({
	nodeId,
	nodeType,
	initialValue,
	onComplete,
	inputClassName,
}: Props) => {
	const { t } = useTranslation();
	const [value, setValue] = useState(initialValue);
	const inputRef = useRef<HTMLInputElement>(null);
	const hasSubmittedRef = useRef(false);
	const updateChapterTitleStore = useSetAtom(updateChapterTitleAtom);
	const updateSceneTitleStore = useSetAtom(updateSceneTitleAtom);
	const { showError } = useToast();

	useEffect(() => {
		const input = inputRef.current;
		if (input) {
			input.focus();
			input.select();
		}
	}, []);

	const commit = useCallback(async () => {
		if (hasSubmittedRef.current) {
			return;
		}
		hasSubmittedRef.current = true;
		try {
			if (nodeType === "chapter") {
				await updateChapterTitle(nodeId, value);
				updateChapterTitleStore({ chapterId: nodeId, title: value });
			} else {
				await updateSceneTitle(nodeId, value);
				updateSceneTitleStore({ sceneId: nodeId, title: value });
			}
			onComplete?.();
		} catch {
			showError(t("outline.titleUpdateFailed"));
			hasSubmittedRef.current = false;
		}
	}, [
		nodeId,
		nodeType,
		value,
		onComplete,
		updateChapterTitleStore,
		updateSceneTitleStore,
		showError,
		t,
	]);

	const handleBlur = useCallback(() => {
		void commit();
	}, [commit]);

	const { handleKeyDown, handleCompositionStart, handleCompositionEnd } =
		useIMESafeEnter({
			onEnter: () => void commit(),
		});

	return (
		<Input
			ref={inputRef}
			type="text"
			value={value}
			onChange={(event) => setValue(event.target.value)}
			onBlur={handleBlur}
			onKeyDown={handleKeyDown}
			onCompositionStart={handleCompositionStart}
			onCompositionEnd={handleCompositionEnd}
			inputSize="sm"
			className={inputClassName}
		/>
	);
};
