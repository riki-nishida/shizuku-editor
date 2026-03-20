import { editorSettingsAtom, themeSettingsAtom } from "@features/settings";
import { selectedNodeAtom } from "@features/work";
import { editorInstanceAtom } from "@features/write/model/editor/store";
import {
	addingNodeAtom,
	chapterToExpandAtom,
	outlineNodesAtom,
	type WorkOutline,
} from "@features/write/model/outline";
import {
	exportDialogOpenAtom,
	keyboardShortcutsDialogOpenAtom,
	searchPanelOpenAtom,
	settingsDialogOpenAtom,
} from "@shared/store";
import { toggleSplitViewAtom } from "@shared/store/split-view";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";

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

export const useMenuEvents = () => {
	const setSettingsOpen = useSetAtom(settingsDialogOpenAtom);
	const setExportOpen = useSetAtom(exportDialogOpenAtom);
	const setShortcutsOpen = useSetAtom(keyboardShortcutsDialogOpenAtom);
	const setSearchPanelOpen = useSetAtom(searchPanelOpenAtom);
	const setThemeSettings = useSetAtom(themeSettingsAtom);
	const toggleSplitView = useSetAtom(toggleSplitViewAtom);
	const [editorSettings, setEditorSettings] = useAtom(editorSettingsAtom);
	const editor = useAtomValue(editorInstanceAtom);
	const editorRef = useRef(editor);
	const editorSettingsRef = useRef(editorSettings);

	const outline = useAtomValue(outlineNodesAtom);
	const [selectedNode, setSelectedNode] = useAtom(selectedNodeAtom);
	const setAddingNode = useSetAtom(addingNodeAtom);
	const setChapterToExpand = useSetAtom(chapterToExpandAtom);
	const outlineRef = useRef(outline);
	const selectedNodeRef = useRef(selectedNode);

	useEffect(() => {
		editorSettingsRef.current = editorSettings;
	}, [editorSettings]);

	useEffect(() => {
		outlineRef.current = outline;
	}, [outline]);

	useEffect(() => {
		selectedNodeRef.current = selectedNode;
	}, [selectedNode]);

	useEffect(() => {
		editorRef.current = editor;
	}, [editor]);

	useEffect(() => {
		const unlistenersRef: UnlistenFn[] = [];
		let isMounted = true;

		const setupListeners = async () => {
			const listeners = await Promise.all([
				listen("menu:settings", () => setSettingsOpen(true)),
				listen("menu:export", () => setExportOpen(true)),
				listen("menu:search", () => {
					if (selectedNodeRef.current?.type === "scene") {
						setSearchPanelOpen(true);
					}
				}),
				listen<string>("menu:theme", (event) => {
					const theme = event.payload as "light" | "dark";
					setThemeSettings({ theme });
				}),
				listen("menu:cut", async () => {
					const ed = editorRef.current;
					if (!ed) return;
					const { from, to } = ed.state.selection;
					const text = ed.state.doc.textBetween(from, to, "\n");
					if (text) {
						await navigator.clipboard.writeText(text);
						ed.commands.deleteSelection();
					}
				}),
				listen("menu:copy", async () => {
					const ed = editorRef.current;
					if (!ed) return;
					const { from, to } = ed.state.selection;
					const text = ed.state.doc.textBetween(from, to, "\n");
					if (text) {
						await navigator.clipboard.writeText(text);
					}
				}),
				listen("menu:paste", async () => {
					const ed = editorRef.current;
					if (!ed) return;
					const text = await navigator.clipboard.readText();
					if (text) {
						ed.commands.insertContent(text);
					}
				}),
				listen("menu:toggle_focus_mode", () => {
					setEditorSettings({
						focusMode: !editorSettingsRef.current.focusMode,
					});
				}),
				listen("menu:split_view", () => {
					if (
						selectedNodeRef.current?.type === "scene" &&
						editorSettingsRef.current.writingMode !== "vertical"
					) {
						toggleSplitView();
					}
				}),
				listen("menu:new_scene", () => {
					const nodes = outlineRef.current;
					const selected = selectedNodeRef.current;
					if (!nodes) return;

					let targetChapterId: string | undefined;

					if (selected?.type === "chapter") {
						const chapter = nodes.chapters.find(
							(c) => c.id === selected.id && !c.is_deleted,
						);
						if (chapter) targetChapterId = chapter.id;
					} else if (selected?.type === "scene") {
						const scene = nodes.scenes.find(
							(s) => s.id === selected.id && !s.is_deleted,
						);
						if (scene) targetChapterId = scene.chapter_id;
					}

					if (!targetChapterId) {
						const firstChapter = nodes.chapters
							.filter((c) => !c.is_deleted)
							.sort((a, b) => a.sort_order - b.sort_order)[0];
						if (firstChapter) targetChapterId = firstChapter.id;
					}

					if (targetChapterId) {
						setChapterToExpand(targetChapterId);
						setAddingNode({ type: "scene", chapterId: targetChapterId });
					}
				}),
				listen("menu:prev_scene", () => {
					const nodes = outlineRef.current;
					const selected = selectedNodeRef.current;
					if (!nodes || selected?.type !== "scene") return;

					const sortedScenes = getSortedScenes(nodes);
					const currentIndex = sortedScenes.findIndex(
						(s) => s.id === selected.id,
					);
					if (currentIndex > 0) {
						setSelectedNode({
							type: "scene",
							id: sortedScenes[currentIndex - 1].id,
						});
					}
				}),
				listen("menu:next_scene", () => {
					const nodes = outlineRef.current;
					const selected = selectedNodeRef.current;
					if (!nodes || selected?.type !== "scene") return;

					const sortedScenes = getSortedScenes(nodes);
					const currentIndex = sortedScenes.findIndex(
						(s) => s.id === selected.id,
					);
					if (currentIndex < sortedScenes.length - 1) {
						setSelectedNode({
							type: "scene",
							id: sortedScenes[currentIndex + 1].id,
						});
					}
				}),
				listen("menu:help", () => setShortcutsOpen(true)),
			]);

			if (isMounted) {
				unlistenersRef.push(...listeners);
			} else {
				for (const unlisten of listeners) {
					unlisten();
				}
			}
		};

		void setupListeners();

		return () => {
			isMounted = false;
			for (const unlisten of unlistenersRef) {
				unlisten();
			}
		};
	}, [
		setSettingsOpen,
		setExportOpen,
		setSearchPanelOpen,
		setThemeSettings,
		setEditorSettings,
		setAddingNode,
		setChapterToExpand,
		setSelectedNode,
		setShortcutsOpen,
		toggleSplitView,
	]);

	useEffect(() => {
		const sceneSelected = selectedNode?.type === "scene";
		invoke("set_scene_menus_enabled", { enabled: sceneSelected }).catch(
			() => {},
		);
		if (sceneSelected) {
			const isHorizontal = editorSettings.writingMode === "horizontal";
			invoke("set_split_view_menu_enabled", { enabled: isHorizontal }).catch(
				() => {},
			);
		}
	}, [selectedNode, editorSettings.writingMode]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const isMod = e.metaKey || e.ctrlKey;

			if (isMod && e.key === "/") {
				e.preventDefault();
				setShortcutsOpen(true);
				return;
			}

			if (isMod && e.key === ",") {
				e.preventDefault();
				setSettingsOpen(true);
				return;
			}

			if (isMod && e.key === "e") {
				e.preventDefault();
				setExportOpen(true);
				return;
			}

			if (isMod && e.key === "\\") {
				if (
					selectedNodeRef.current?.type === "scene" &&
					editorSettingsRef.current.writingMode !== "vertical"
				) {
					e.preventDefault();
					toggleSplitView();
				}
				return;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [setShortcutsOpen, setSettingsOpen, setExportOpen, toggleSplitView]);
};
