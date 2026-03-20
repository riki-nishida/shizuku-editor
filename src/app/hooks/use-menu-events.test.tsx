import { selectedNodeAtom } from "@features/work";
import { editorInstanceAtom } from "@features/write/model/editor/store";
import {
	addingNodeAtom,
	chapterToExpandAtom,
	outlineNodesAtom,
} from "@features/write/model/outline";
import {
	exportDialogOpenAtom,
	keyboardShortcutsDialogOpenAtom,
	searchPanelOpenAtom,
	settingsDialogOpenAtom,
} from "@shared/store";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { createTestWrapper } from "@test/utils";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMenuEvents } from "./use-menu-events";

vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(() => Promise.resolve()),
}));

const mockListeners: Map<string, ((event: { payload: unknown }) => void)[]> =
	new Map();

vi.mock("@tauri-apps/api/event", () => ({
	listen: vi.fn(
		(
			eventName: string,
			callback: (event: { payload: unknown }) => void,
		): Promise<UnlistenFn> => {
			if (!mockListeners.has(eventName)) {
				mockListeners.set(eventName, []);
			}
			mockListeners.get(eventName)?.push(callback);
			return Promise.resolve(() => {
				const listeners = mockListeners.get(eventName) || [];
				const index = listeners.indexOf(callback);
				if (index > -1) {
					listeners.splice(index, 1);
				}
			});
		},
	),
}));

describe("useMenuEvents", () => {
	let store: ReturnType<typeof createTestWrapper>["store"];
	let Wrapper: ReturnType<typeof createTestWrapper>["Wrapper"];

	beforeEach(() => {
		mockListeners.clear();
		const testWrapper = createTestWrapper();
		store = testWrapper.store;
		Wrapper = testWrapper.Wrapper;

		store.set(editorInstanceAtom, null);
		store.set(addingNodeAtom, null);
		store.set(chapterToExpandAtom, null);
		store.set(outlineNodesAtom, undefined);
		store.set(settingsDialogOpenAtom, false);
		store.set(exportDialogOpenAtom, false);
		store.set(keyboardShortcutsDialogOpenAtom, false);
		store.set(searchPanelOpenAtom, false);
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("キーボードショートカット設定", () => {
		it("キーボードイベントリスナーが登録される", async () => {
			const addEventListenerSpy = vi.spyOn(document, "addEventListener");

			renderHook(() => useMenuEvents(), { wrapper: Wrapper });

			await waitFor(() => {
				expect(mockListeners.size).toBeGreaterThan(0);
			});

			expect(addEventListenerSpy).toHaveBeenCalledWith(
				"keydown",
				expect.any(Function),
			);

			addEventListenerSpy.mockRestore();
		});

		it("アンマウント時にキーボードイベントリスナーが解除される", async () => {
			const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

			const { unmount } = renderHook(() => useMenuEvents(), {
				wrapper: Wrapper,
			});

			await waitFor(() => {
				expect(mockListeners.size).toBeGreaterThan(0);
			});

			unmount();

			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				"keydown",
				expect.any(Function),
			);

			removeEventListenerSpy.mockRestore();
		});
	});

	describe("Tauriメニューイベント", () => {
		it("menu:settings イベントでリスナーが登録される", async () => {
			renderHook(() => useMenuEvents(), { wrapper: Wrapper });

			await waitFor(() => {
				expect(mockListeners.has("menu:settings")).toBe(true);
			});
		});

		it("menu:settings イベント発火で設定ダイアログが開く", async () => {
			renderHook(() => useMenuEvents(), { wrapper: Wrapper });

			await waitFor(() => {
				expect(mockListeners.has("menu:settings")).toBe(true);
			});

			expect(store.get(settingsDialogOpenAtom)).toBe(false);

			const listeners = mockListeners.get("menu:settings") || [];
			for (const cb of listeners) {
				cb({ payload: undefined });
			}

			expect(store.get(settingsDialogOpenAtom)).toBe(true);
		});

		it("menu:export イベントでリスナーが登録される", async () => {
			renderHook(() => useMenuEvents(), { wrapper: Wrapper });

			await waitFor(() => {
				expect(mockListeners.has("menu:export")).toBe(true);
			});
		});

		it("menu:export イベント発火でエクスポートダイアログが開く", async () => {
			renderHook(() => useMenuEvents(), { wrapper: Wrapper });

			await waitFor(() => {
				expect(mockListeners.has("menu:export")).toBe(true);
			});

			expect(store.get(exportDialogOpenAtom)).toBe(false);

			const listeners = mockListeners.get("menu:export") || [];
			for (const cb of listeners) {
				cb({ payload: undefined });
			}

			expect(store.get(exportDialogOpenAtom)).toBe(true);
		});

		it("menu:theme イベントでリスナーが登録される", async () => {
			renderHook(() => useMenuEvents(), { wrapper: Wrapper });

			await waitFor(() => {
				expect(mockListeners.has("menu:theme")).toBe(true);
			});
		});

		it("menu:new_scene イベントでリスナーが登録される", async () => {
			renderHook(() => useMenuEvents(), { wrapper: Wrapper });

			await waitFor(() => {
				expect(mockListeners.has("menu:new_scene")).toBe(true);
			});
		});

		it("menu:help イベント発火でショートカットダイアログが開く", async () => {
			renderHook(() => useMenuEvents(), { wrapper: Wrapper });

			await waitFor(() => {
				expect(mockListeners.has("menu:help")).toBe(true);
			});

			expect(store.get(keyboardShortcutsDialogOpenAtom)).toBe(false);

			const listeners = mockListeners.get("menu:help") || [];
			for (const cb of listeners) {
				cb({ payload: undefined });
			}

			expect(store.get(keyboardShortcutsDialogOpenAtom)).toBe(true);
		});

		it("menu:search イベント発火で検索パネルが開く", async () => {
			store.set(selectedNodeAtom, { type: "scene", id: "scene-1" });

			renderHook(() => useMenuEvents(), { wrapper: Wrapper });

			await waitFor(() => {
				expect(mockListeners.has("menu:search")).toBe(true);
			});

			expect(store.get(searchPanelOpenAtom)).toBe(false);

			const listeners = mockListeners.get("menu:search") || [];
			for (const cb of listeners) {
				cb({ payload: undefined });
			}

			expect(store.get(searchPanelOpenAtom)).toBe(true);
		});

		it("アンマウント時にリスナーがクリーンアップされる", async () => {
			const { unmount } = renderHook(() => useMenuEvents(), {
				wrapper: Wrapper,
			});

			await waitFor(() => {
				expect(mockListeners.size).toBeGreaterThan(0);
			});

			const initialListenerCount = Array.from(mockListeners.values()).reduce(
				(acc, listeners) => acc + listeners.length,
				0,
			);

			expect(initialListenerCount).toBeGreaterThan(0);

			unmount();

			await waitFor(() => {
				const remainingListenerCount = Array.from(
					mockListeners.values(),
				).reduce((acc, listeners) => acc + listeners.length, 0);
				expect(remainingListenerCount).toBe(0);
			});
		});
	});
});
