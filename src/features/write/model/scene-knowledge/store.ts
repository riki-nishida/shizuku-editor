import { atom } from "jotai";
import {
	getSceneKnowledge,
	linkKnowledgeToScene,
	unlinkKnowledgeFromScene,
} from "./commands";
import type { KnowledgeOutline } from "./types";

export const sceneKnowledgeAtom = atom<KnowledgeOutline[]>([]);

export const loadSceneKnowledgeAtom = atom(
	null,
	async (_get, set, sceneId: string | null) => {
		if (sceneId === null) {
			set(sceneKnowledgeAtom, []);
			return;
		}
		const result = await getSceneKnowledge(sceneId);
		if (result.ok) {
			set(sceneKnowledgeAtom, result.value);
		}
	},
);

export const linkKnowledgeAtom = atom(
	null,
	async (
		get,
		set,
		{ sceneId, knowledge }: { sceneId: string; knowledge: KnowledgeOutline },
	) => {
		const result = await linkKnowledgeToScene(sceneId, knowledge.id);
		if (result.ok) {
			const current = get(sceneKnowledgeAtom);

			if (!current.some((k) => k.id === knowledge.id)) {
				set(sceneKnowledgeAtom, [...current, knowledge]);
			}
		}
		return result.ok;
	},
);

export const unlinkKnowledgeAtom = atom(
	null,
	async (
		get,
		set,
		{ sceneId, knowledgeId }: { sceneId: string; knowledgeId: string },
	) => {
		const result = await unlinkKnowledgeFromScene(sceneId, knowledgeId);
		if (result.ok) {
			const current = get(sceneKnowledgeAtom);
			set(
				sceneKnowledgeAtom,
				current.filter((k) => k.id !== knowledgeId),
			);
		}
		return result.ok;
	},
);
