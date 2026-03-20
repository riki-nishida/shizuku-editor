import type { ContentMarkup } from "tiptap-japanese";
import { contentToHtml, htmlToContent } from "tiptap-japanese";

export type SceneData = {
	id: string;
	title: string;
	contentText: string;
	contentMarkups: ContentMarkup[];
};

export function scenesToHtml(scenes: SceneData[]): string {
	if (scenes.length === 0) {
		return "<p></p>";
	}

	const parts: string[] = [];

	for (let i = 0; i < scenes.length; i++) {
		const scene = scenes[i];

		if (i > 0) {
			parts.push(
				`<div data-type="scene-separator" data-scene-id="${escapeHtml(scene.id)}" data-scene-title="${escapeHtml(scene.title)}" class="scene-separator" contenteditable="false"><div class="scene-separator-line"><span class="scene-separator-title">${escapeHtml(scene.title)}</span></div></div>`,
			);
		}

		const sceneHtml = contentToHtml(scene.contentText, scene.contentMarkups);
		parts.push(sceneHtml);
	}

	return parts.join("");
}

export function htmlToScenes(
	html: string,
	originalScenes: SceneData[],
): { scenes: SceneData[]; modifiedSceneIds: Set<string> } {
	if (!html || html === "<p></p>") {
		return { scenes: originalScenes, modifiedSceneIds: new Set() };
	}

	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");
	const body = doc.body;

	const scenes: SceneData[] = [];
	const modifiedSceneIds = new Set<string>();

	let currentSceneIndex = 0;
	let currentContent: Node[] = [];

	function processCurrentContent() {
		if (currentSceneIndex >= originalScenes.length) return;

		const originalScene = originalScenes[currentSceneIndex];

		const tempDiv = document.createElement("div");
		for (const node of currentContent) {
			tempDiv.appendChild(node.cloneNode(true));
		}
		const contentHtml = tempDiv.innerHTML || "<p></p>";

		const { text, markups } = htmlToContent(contentHtml);

		const scene: SceneData = {
			id: originalScene.id,
			title: originalScene.title,
			contentText: text,
			contentMarkups: markups,
		};

		if (
			text !== originalScene.contentText ||
			JSON.stringify(markups) !== JSON.stringify(originalScene.contentMarkups)
		) {
			modifiedSceneIds.add(scene.id);
		}

		scenes.push(scene);
		currentContent = [];
		currentSceneIndex++;
	}

	for (const node of body.childNodes) {
		if (
			node.nodeType === Node.ELEMENT_NODE &&
			(node as Element).getAttribute?.("data-type") === "scene-separator"
		) {
			processCurrentContent();
		} else {
			currentContent.push(node);
		}
	}

	processCurrentContent();

	while (currentSceneIndex < originalScenes.length) {
		scenes.push(originalScenes[currentSceneIndex]);
		currentSceneIndex++;
	}

	return { scenes, modifiedSceneIds };
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
