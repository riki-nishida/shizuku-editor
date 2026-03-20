import { editorSettingsAtom, themeSettingsAtom } from "@features/settings";
import { selectedNodeAtom } from "@features/work";
import { editorCommandsAtom } from "@features/write/model/editor/store";
import {
	addingNodeAtom,
	chapterToExpandAtom,
	outlineNodesAtom,
	type WorkOutline,
} from "@features/write/model/outline";
import { formatShortcut, isMacOS } from "@shared/lib";
import {
	aboutDialogOpenAtom,
	exportDialogOpenAtom,
	keyboardShortcutsDialogOpenAtom,
	searchPanelOpenAtom,
	settingsDialogOpenAtom,
} from "@shared/store";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { MenuBarItem } from "./menu-bar";

const getSortedScenes = (outline: WorkOutline) => {
	const sortedChapters = [...outline.chapters]
		.filter((c) => !c.is_deleted)
		.sort((a, b) => a.sort_order - b.sort_order);

	const sortedScenes: { id: string; chapter_id: string }[] = [];
	for (const chapter of sortedChapters) {
		const chapterScenes = outline.scenes
			.filter((s) => s.chapter_id === chapter.id && !s.is_deleted)
			.sort((a, b) => a.sort_order - b.sort_order);
		sortedScenes.push(...chapterScenes);
	}
	return sortedScenes;
};

type MenuBarMenu = {
	id: string;
	label: string;
	items: MenuBarItem[];
};

export const useAppMenu = (): MenuBarMenu[] => {
	const { t } = useTranslation();
	const setSettingsOpen = useSetAtom(settingsDialogOpenAtom);
	const setExportOpen = useSetAtom(exportDialogOpenAtom);
	const setShortcutsOpen = useSetAtom(keyboardShortcutsDialogOpenAtom);
	const setSearchPanelOpen = useSetAtom(searchPanelOpenAtom);
	const setAboutOpen = useSetAtom(aboutDialogOpenAtom);
	const [themeSettings, setThemeSettings] = useAtom(themeSettingsAtom);
	const [editorSettings, setEditorSettings] = useAtom(editorSettingsAtom);
	const editorCommands = useAtomValue(editorCommandsAtom);

	const outline = useAtomValue(outlineNodesAtom);
	const [selectedNode, setSelectedNode] = useAtom(selectedNodeAtom);
	const setAddingNode = useSetAtom(addingNodeAtom);
	const setChapterToExpand = useSetAtom(chapterToExpandAtom);

	const menus = useMemo((): MenuBarMenu[] => {
		const isSceneSelected = selectedNode?.type === "scene";

		const handleQuit = () => {
			void getCurrentWindow().close();
		};

		const handleThemeChange = (theme: "light" | "dark") => {
			setThemeSettings({ theme });
		};

		const handleNewScene = () => {
			if (!outline) return;

			let targetChapterId: string | undefined;

			if (selectedNode?.type === "chapter") {
				const chapter = outline.chapters.find(
					(c) => c.id === selectedNode.id && !c.is_deleted,
				);
				if (chapter) targetChapterId = chapter.id;
			} else if (selectedNode?.type === "scene") {
				const scene = outline.scenes.find(
					(s) => s.id === selectedNode.id && !s.is_deleted,
				);
				if (scene) targetChapterId = scene.chapter_id;
			}

			if (!targetChapterId) {
				const firstChapter = outline.chapters
					.filter((c) => !c.is_deleted)
					.sort((a, b) => a.sort_order - b.sort_order)[0];
				if (firstChapter) targetChapterId = firstChapter.id;
			}

			if (targetChapterId) {
				setChapterToExpand(targetChapterId);
				setAddingNode({ type: "scene", chapterId: targetChapterId });
			}
		};

		const handlePrevScene = () => {
			if (!outline || selectedNode?.type !== "scene") return;

			const sortedScenes = getSortedScenes(outline);
			const currentIndex = sortedScenes.findIndex(
				(s) => s.id === selectedNode.id,
			);
			if (currentIndex > 0) {
				setSelectedNode({
					type: "scene",
					id: sortedScenes[currentIndex - 1].id,
				});
			}
		};

		const handleNextScene = () => {
			if (!outline || selectedNode?.type !== "scene") return;

			const sortedScenes = getSortedScenes(outline);
			const currentIndex = sortedScenes.findIndex(
				(s) => s.id === selectedNode.id,
			);
			if (currentIndex < sortedScenes.length - 1) {
				setSelectedNode({
					type: "scene",
					id: sortedScenes[currentIndex + 1].id,
				});
			}
		};

		return [
			{
				id: "file",
				label: t("menu.file"),
				items: [
					{
						id: "new-scene",
						label: t("menu.newScene"),
						shortcut: formatShortcut("Mod+N"),
						onClick: handleNewScene,
					},
					{ type: "separator", id: "sep-1" },
					{
						id: "export",
						label: t("menu.export"),
						shortcut: formatShortcut("Mod+E"),
						onClick: () => setExportOpen(true),
					},
					{ type: "separator", id: "sep-2" },
					{
						id: "settings",
						label: t("menu.settings"),
						shortcut: formatShortcut("Mod+,"),
						onClick: () => setSettingsOpen(true),
					},
					{ type: "separator", id: "sep-3" },
					{
						id: "quit",
						label: t("menu.quit"),
						shortcut: isMacOS() ? "⌘ Q" : "Alt+F4",
						onClick: handleQuit,
					},
				],
			},
			{
				id: "edit",
				label: t("menu.edit"),
				items: [
					{
						id: "undo",
						label: t("menu.undo"),
						shortcut: formatShortcut("Mod+Z"),
						onClick: () => editorCommands.undo(),
					},
					{
						id: "redo",
						label: t("menu.redo"),
						shortcut: formatShortcut("Mod+Shift+Z"),
						onClick: () => editorCommands.redo(),
					},
					{ type: "separator", id: "sep-edit-1" },
					{
						id: "cut",
						label: t("menu.cut"),
						shortcut: formatShortcut("Mod+X"),
						onClick: () => void editorCommands.cut(),
					},
					{
						id: "copy",
						label: t("menu.copy"),
						shortcut: formatShortcut("Mod+C"),
						onClick: () => void editorCommands.copy(),
					},
					{
						id: "paste",
						label: t("menu.paste"),
						shortcut: formatShortcut("Mod+V"),
						onClick: () => void editorCommands.paste(),
					},
					{
						id: "select-all",
						label: t("menu.selectAll"),
						shortcut: formatShortcut("Mod+A"),
						onClick: () => editorCommands.selectAll(),
					},
					{ type: "separator", id: "sep-edit-2" },
					{
						id: "search",
						label: t("menu.find"),
						shortcut: formatShortcut("Mod+F"),
						disabled: !isSceneSelected,
						onClick: () => setSearchPanelOpen(true),
					},
				],
			},
			{
				id: "view",
				label: t("menu.view"),
				items: [
					{
						type: "submenu",
						id: "theme",
						label: t("menu.theme"),
						items: [
							{
								id: "theme-light",
								label: t("menu.light"),
								checked: themeSettings.theme === "light",
								onClick: () => handleThemeChange("light"),
							},
							{
								id: "theme-dark",
								label: t("menu.dark"),
								checked: themeSettings.theme === "dark",
								onClick: () => handleThemeChange("dark"),
							},
						],
					},
					{ type: "separator", id: "sep-view-1" },
					{
						id: "focus-mode",
						label: t("menu.focusMode"),
						shortcut: formatShortcut("Mod+Shift+F"),
						disabled: !isSceneSelected,
						checked: editorSettings.focusMode,
						onClick: () =>
							setEditorSettings({ focusMode: !editorSettings.focusMode }),
					},
					{
						id: "typewriter-mode",
						label: t("menu.typewriterScroll"),
						shortcut: formatShortcut("Mod+Shift+T"),
						disabled: true,
						checked: false,
						onClick: () => {},
					},
				],
			},
			{
				id: "navigate",
				label: t("menu.navigate"),
				items: [
					{
						id: "prev-scene",
						label: t("menu.prevScene"),
						shortcut: formatShortcut("Mod+["),
						disabled: !isSceneSelected,
						onClick: handlePrevScene,
					},
					{
						id: "next-scene",
						label: t("menu.nextScene"),
						shortcut: formatShortcut("Mod+]"),
						disabled: !isSceneSelected,
						onClick: handleNextScene,
					},
				],
			},
			{
				id: "help",
				label: t("menu.help"),
				items: [
					{
						id: "keyboard-shortcuts",
						label: t("menu.keyboardShortcuts"),
						shortcut: formatShortcut("Mod+/"),
						onClick: () => setShortcutsOpen(true),
					},
					{ type: "separator", id: "sep-help-1" },
					{
						id: "about",
						label: t("menu.about"),
						onClick: () => setAboutOpen(true),
					},
				],
			},
		];
	}, [
		t,
		themeSettings.theme,
		editorSettings.focusMode,
		outline,
		selectedNode,
		setSettingsOpen,
		setExportOpen,
		setShortcutsOpen,
		setSearchPanelOpen,
		setAboutOpen,
		setThemeSettings,
		setEditorSettings,
		setAddingNode,
		setChapterToExpand,
		setSelectedNode,
		editorCommands,
	]);

	return menus;
};
