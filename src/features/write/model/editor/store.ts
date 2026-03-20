import { calculateWordCount } from "@shared/lib/text";
import { parseMarkups } from "@shared/lib/tiptap";
import { liveWordCountAtom } from "@shared/store/ui";
import type { Editor } from "@tiptap/react";
import { atom } from "jotai";
import { atomFamily } from "jotai-family";
import { updateSceneWordCountAtom } from "../outline/store";
import { getScene } from "./commands";
import type { ContentMarkup, Scene } from "./types";

export const editorInstanceAtom = atom<Editor | null>(null);

export const canUndoAtom = atom(false);
export const canRedoAtom = atom(false);

export const editorCommandsAtom = atom((get) => {
	const editor = get(editorInstanceAtom);

	return {
		undo: () => editor?.commands.undo(),
		redo: () => editor?.commands.redo(),
		focus: () => editor?.commands.focus(),

		cut: async () => {
			if (!editor) return;
			const { from, to } = editor.state.selection;
			const text = editor.state.doc.textBetween(from, to, "\n");
			if (text) {
				await navigator.clipboard.writeText(text);
				editor.commands.deleteSelection();
			}
		},

		copy: async () => {
			if (!editor) return;
			const { from, to } = editor.state.selection;
			const text = editor.state.doc.textBetween(from, to, "\n");
			if (text) {
				await navigator.clipboard.writeText(text);
			}
		},

		paste: async () => {
			if (!editor) return;
			const text = await navigator.clipboard.readText();
			if (text) {
				editor.commands.insertContent(text);
			}
		},

		selectAll: () => editor?.commands.selectAll(),
	};
});

export const selectedSceneAtom = atom<Scene | null>(null);

export const loadSelectedSceneAtom = atom(
	null,
	async (_get, set, sceneId: string | null) => {
		if (sceneId === null) {
			set(selectedSceneAtom, null);
			return;
		}
		const result = await getScene(sceneId);
		if (result.ok) {
			set(selectedSceneAtom, result.value);
		}
	},
);

export const reloadSceneContentAtom = atom(
	null,
	async (_get, set, sceneId: string) => {
		const result = await getScene(sceneId);
		if (result.ok) {
			const scene = result.value;
			const contentText = scene.content_text || "";

			set(selectedSceneAtom, scene);

			const draftAtom = sceneDraftAtomFamily(sceneId);
			set(draftAtom, {
				contentText,
				contentMarkups: parseMarkups(scene.content_markups),
			});

			const wordCount = calculateWordCount(contentText);
			set(liveWordCountAtom, wordCount);
			set(updateSceneWordCountAtom, { sceneId, wordCount });
		}
	},
);

export const updateSelectedSceneAtom = atom(
	null,
	(get, set, update: Partial<Scene>) => {
		const current = get(selectedSceneAtom);
		if (current) {
			set(selectedSceneAtom, { ...current, ...update });
		}
	},
);

export type SceneDraftState = {
	contentText: string;
	contentMarkups: ContentMarkup[];
};

export const sceneDraftAtomFamily = atomFamily((_sceneId: string) =>
	atom<SceneDraftState>({
		contentText: "",
		contentMarkups: [],
	}),
);

export const initSceneDraftAtom = atom(
	null,
	(
		get,
		set,
		{
			sceneId,
			contentText,
			contentMarkups,
		}: {
			sceneId: string;
			contentText: string;
			contentMarkups: ContentMarkup[];
		},
	) => {
		const draftAtom = sceneDraftAtomFamily(sceneId);
		const current = get(draftAtom);

		if (current.contentText === "" && current.contentMarkups.length === 0) {
			set(draftAtom, { contentText, contentMarkups });
		}
	},
);

export const updateSceneDraftAtom = atom(
	null,
	(
		_get,
		set,
		{
			sceneId,
			contentText,
			contentMarkups,
		}: {
			sceneId: string;
			contentText: string;
			contentMarkups: ContentMarkup[];
		},
	) => {
		const draftAtom = sceneDraftAtomFamily(sceneId);
		set(draftAtom, { contentText, contentMarkups });
	},
);

export const resetSceneDraftAtom = atom(null, (_get, set, sceneId: string) => {
	const draftAtom = sceneDraftAtomFamily(sceneId);
	set(draftAtom, { contentText: "", contentMarkups: [] });
});
