import { invokeCommand } from "@shared/lib/commands";
import type { KnowledgeOutline } from "./types";

export const getSceneKnowledge = (sceneId: string) => {
	return invokeCommand<KnowledgeOutline[]>("get_scene_knowledge", { sceneId });
};

export const linkKnowledgeToScene = (sceneId: string, knowledgeId: string) => {
	return invokeCommand<string>("link_knowledge_to_scene", {
		sceneId,
		knowledgeId,
	});
};

export const unlinkKnowledgeFromScene = (
	sceneId: string,
	knowledgeId: string,
) => {
	return invokeCommand<void>("unlink_knowledge_from_scene", {
		sceneId,
		knowledgeId,
	});
};
