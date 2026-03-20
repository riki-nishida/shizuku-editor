import { showConfirmDialog } from "@shared/lib/dialog";
import { useToast } from "@shared/lib/toast";
import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	createSceneVersion,
	deleteSceneVersion,
	restoreSceneVersion,
	updateSceneVersionLabel,
} from "../../model/version/commands";
import {
	loadSceneVersionsAtom,
	sceneVersionsAtom,
} from "../../model/version/store";
import type { SceneVersion } from "../../model/version/types";

export const useVersionHistory = (sceneId: string) => {
	const { t } = useTranslation();
	const [versions, setVersions] = useAtom(sceneVersionsAtom);
	const loadVersions = useSetAtom(loadSceneVersionsAtom);
	const { showSuccess, showError, showInfo } = useToast();

	const [isSaving, setIsSaving] = useState(false);
	const [isRestoring, setIsRestoring] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [previewVersion, setPreviewVersion] = useState<SceneVersion | null>(
		null,
	);
	const [expandedVersionId, setExpandedVersionId] = useState<string | null>(
		null,
	);
	const [comparisonTarget, setComparisonTarget] = useState<
		"current" | "previous"
	>("current");

	useEffect(() => {
		loadVersions(sceneId);
	}, [sceneId, loadVersions]);

	const saveVersion = useCallback(
		async (label?: string) => {
			setIsSaving(true);
			try {
				const result = await createSceneVersion(sceneId, label);
				if (result.ok) {
					setVersions((prev) => [result.value, ...prev]);
					showSuccess(t("versionHistory.saved"));
					return true;
				}
				showError(t("versionHistory.saveFailed"));
				return false;
			} finally {
				setIsSaving(false);
			}
		},
		[sceneId, setVersions, showSuccess, showError, t],
	);

	const restoreVersion = useCallback(
		async (versionId: string) => {
			const confirmed = await showConfirmDialog(
				t("versionHistory.restoreConfirm"),
				{ title: t("versionHistory.restoreTitle"), kind: "warning" },
			);
			if (!confirmed) {
				return false;
			}

			setIsRestoring(true);
			try {
				const result = await restoreSceneVersion(
					versionId,
					t("versionHistory.preRestoreLabel"),
				);
				if (result.ok) {
					if (result.value) {
						await loadVersions(sceneId);
						showSuccess(t("versionHistory.restored"));
						return true;
					}
					showInfo(t("versionHistory.sameContent"));
					return false;
				}
				showError(t("versionHistory.restoreFailed"));
				return false;
			} finally {
				setIsRestoring(false);
			}
		},
		[sceneId, loadVersions, showSuccess, showError, showInfo, t],
	);

	const deleteVersion = useCallback(
		async (versionId: string) => {
			const confirmed = await showConfirmDialog(
				t("versionHistory.deleteConfirm"),
				{ title: t("versionHistory.deleteTitle"), kind: "warning" },
			);
			if (!confirmed) {
				return false;
			}

			setIsDeleting(true);
			try {
				const result = await deleteSceneVersion(versionId);
				if (result.ok) {
					setVersions((prev) => prev.filter((v) => v.id !== versionId));
					if (expandedVersionId === versionId) {
						setExpandedVersionId(null);
					}
					showSuccess(t("versionHistory.deleted"));
					return true;
				}
				showError(t("versionHistory.deleteFailed"));
				return false;
			} finally {
				setIsDeleting(false);
			}
		},
		[setVersions, showSuccess, showError, expandedVersionId, t],
	);

	const openPreview = useCallback((version: SceneVersion) => {
		setPreviewVersion(version);
	}, []);

	const closePreview = useCallback(() => {
		setPreviewVersion(null);
	}, []);

	const updateLabel = useCallback(
		async (versionId: string, label: string | null) => {
			setVersions((prev) =>
				prev.map((v) => (v.id === versionId ? { ...v, label } : v)),
			);

			const result = await updateSceneVersionLabel(versionId, label);
			if (!result.ok) {
				await loadVersions(sceneId);
				showError(t("versionHistory.labelUpdateFailed"));
			}
		},
		[setVersions, loadVersions, sceneId, showError, t],
	);

	const toggleExpanded = useCallback((versionId: string) => {
		setExpandedVersionId((prev) => (prev === versionId ? null : versionId));
	}, []);

	return {
		versions,
		isSaving,
		isRestoring,
		isDeleting,
		previewVersion,
		saveVersion,
		restoreVersion,
		deleteVersion,
		openPreview,
		closePreview,
		updateLabel,
		expandedVersionId,
		toggleExpanded,
		comparisonTarget,
		setComparisonTarget,
	};
};
