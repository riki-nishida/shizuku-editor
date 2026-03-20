import i18n from "@shared/lib/i18n";
import { atom } from "jotai";
import { createSceneVersion, getSceneVersions } from "./commands";
import type { SceneVersion } from "./types";

export const sceneVersionsAtom = atom<SceneVersion[]>([]);

export const loadSceneVersionsAtom = atom(
	null,
	async (_get, set, sceneId: string | null) => {
		if (sceneId === null) {
			set(sceneVersionsAtom, []);
			return;
		}
		const result = await getSceneVersions(sceneId);
		if (result.ok) {
			set(sceneVersionsAtom, result.value);
		}
	},
);

export const refreshSceneVersionsAtom = atom(null, async (get, set) => {
	const versions = get(sceneVersionsAtom);
	if (versions.length === 0) return;

	const sceneId = versions[0].scene_id;
	const result = await getSceneVersions(sceneId);
	if (result.ok) {
		set(sceneVersionsAtom, result.value);
	}
});

export const createSnapshotAtom = atom(
	null,
	async (get, set, sceneId: string) => {
		const count = get(sceneVersionsAtom).length;
		const label =
			count === 0
				? i18n.t("write.editor.snapshotLabel")
				: i18n.t("write.editor.snapshotLabelNumbered", {
						number: count + 1,
					});
		const result = await createSceneVersion(sceneId, label);
		if (result.ok) {
			set(sceneVersionsAtom, (prev) => [result.value, ...prev]);
		}
		return result.ok;
	},
);
