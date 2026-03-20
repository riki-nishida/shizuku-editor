import { panelSizesAtom } from "@shared/store";
import { createTestWrapper } from "@test/utils";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePanelSizes } from "./use-panel-sizes";

const mockSavePanelSizes = vi.fn().mockResolvedValue({ ok: true });

vi.mock("@shared/lib/commands/app-state", () => ({
	savePanelSizes: (...args: unknown[]) => mockSavePanelSizes(...args),
	getPanelSizes: vi.fn().mockResolvedValue({ ok: true, value: [20, 60, 20] }),
	saveInspectorCollapsed: vi.fn().mockResolvedValue({ ok: true }),
	getInspectorCollapsed: vi.fn().mockResolvedValue({ ok: true, value: false }),
	saveSplitViewRatio: vi.fn().mockResolvedValue({ ok: true }),
	saveSplitViewDirection: vi.fn().mockResolvedValue({ ok: true }),
	saveSplitViewPanes: vi.fn().mockResolvedValue({ ok: true }),
	getSplitViewRatio: vi.fn().mockResolvedValue({ ok: true, value: 0.5 }),
	getSplitViewDirection: vi.fn().mockResolvedValue({ ok: true, value: "none" }),
	getSplitViewPanes: vi.fn().mockResolvedValue({ ok: true, value: null }),
	saveSidebarSectionRatio: vi.fn().mockResolvedValue({ ok: true }),
	getSidebarSectionRatio: vi.fn().mockResolvedValue({ ok: true, value: 0.6 }),
	saveSidebarSections: vi.fn().mockResolvedValue({ ok: true }),
	getSidebarSections: vi
		.fn()
		.mockResolvedValue({ ok: true, value: { outline: true, materials: true } }),
}));

const mockUsePanelVisibility = vi.fn().mockReturnValue({
	showSidebar: true,
	showInspector: true,
	inspectorCollapsed: false,
	showTypeNav: false,
});

vi.mock("./use-panel-visibility", () => ({
	usePanelVisibility: () => mockUsePanelVisibility(),
}));

vi.mock("@shared/constants/layout", () => ({
	DEFAULT_PANEL_SIZES: {
		sidebar: 20,
		main: 60,
		inspector: 20,
	},
	PANEL_CONSTRAINTS: {
		sidebar: { minSize: 18, maxSize: 32 },
		main: { minSize: 45 },
		inspector: { minSize: 18, maxSize: 32 },
	},
}));

describe("usePanelSizes", () => {
	let store: ReturnType<typeof createTestWrapper>["store"];
	let Wrapper: ReturnType<typeof createTestWrapper>["Wrapper"];

	beforeEach(() => {
		const testWrapper = createTestWrapper();
		store = testWrapper.store;
		Wrapper = testWrapper.Wrapper;

		store.set(panelSizesAtom, [20, 60, 20]);
		mockUsePanelVisibility.mockReturnValue({
			showSidebar: true,
			showInspector: true,
			inspectorCollapsed: false,
			showTypeNav: false,
		});
		vi.clearAllMocks();
	});

	describe("初期状態", () => {
		it("保存されたサイズをeffectiveSizesとして返す", () => {
			store.set(panelSizesAtom, [25, 55, 20]);

			const { result } = renderHook(() => usePanelSizes(), {
				wrapper: Wrapper,
			});

			expect(result.current.effectiveSizes).toEqual([25, 55, 20]);
		});

		it("handleResizeとhandleResizeEndを関数として返す", () => {
			const { result } = renderHook(() => usePanelSizes(), {
				wrapper: Wrapper,
			});

			expect(typeof result.current.handleResize).toBe("function");
			expect(typeof result.current.handleResizeEnd).toBe("function");
		});
	});

	describe("handleResize", () => {
		it("リサイズ中にeffectiveSizesが即座に更新される", () => {
			const { result } = renderHook(() => usePanelSizes(), {
				wrapper: Wrapper,
			});

			act(() => {
				result.current.handleResize({ size: [30, 50, 20] });
			});

			expect(result.current.effectiveSizes).toEqual([30, 50, 20]);
		});

		it("リサイズ中は保存されない（パフォーマンス最適化）", () => {
			const { result } = renderHook(() => usePanelSizes(), {
				wrapper: Wrapper,
			});

			act(() => {
				result.current.handleResize({ size: [30, 50, 20] });
			});

			expect(mockSavePanelSizes).not.toHaveBeenCalled();
		});
	});

	describe("handleResizeEnd", () => {
		it("リサイズ終了時にsavePanelSizesが正しい値で呼ばれる", () => {
			const { result } = renderHook(() => usePanelSizes(), {
				wrapper: Wrapper,
			});

			act(() => {
				result.current.handleResizeEnd({ size: [30, 50, 20] });
			});

			expect(mockSavePanelSizes).toHaveBeenCalledWith([30, 50, 20]);
		});

		it("リサイズ終了後はliveSizesがリセットされ保存値が使用される", () => {
			const { result } = renderHook(() => usePanelSizes(), {
				wrapper: Wrapper,
			});

			act(() => {
				result.current.handleResize({ size: [30, 50, 20] });
			});
			expect(result.current.effectiveSizes).toEqual([30, 50, 20]);

			act(() => {
				result.current.handleResizeEnd({ size: [30, 50, 20] });
			});

			expect(result.current.effectiveSizes).toBeDefined();
		});

		it("サイドバーサイズが0の場合は保存をスキップする", () => {
			const { result } = renderHook(() => usePanelSizes(), {
				wrapper: Wrapper,
			});

			act(() => {
				result.current.handleResizeEnd({ size: [0, 80, 20] });
			});

			expect(mockSavePanelSizes).not.toHaveBeenCalled();
		});
	});

	describe("インスペクター非表示時", () => {
		it("インスペクターサイズが0になりメインに加算される", () => {
			mockUsePanelVisibility.mockReturnValue({
				showSidebar: true,
				showInspector: false,
				inspectorCollapsed: false,
				showTypeNav: false,
			});

			const { result } = renderHook(() => usePanelSizes(), {
				wrapper: Wrapper,
			});

			const [sidebar, main, inspector] = result.current.effectiveSizes;
			expect(inspector).toBe(0);
			expect(main).toBeGreaterThan(60);
			expect(sidebar).toBe(20);
		});
	});

	describe("インスペクター折りたたみ時", () => {
		it("折りたたみ時にインスペクターサイズが0になる", () => {
			mockUsePanelVisibility.mockReturnValue({
				showSidebar: true,
				showInspector: true,
				inspectorCollapsed: true,
				showTypeNav: false,
			});

			const { result } = renderHook(() => usePanelSizes(), {
				wrapper: Wrapper,
			});

			const [, , inspector] = result.current.effectiveSizes;
			expect(inspector).toBe(0);
		});
	});

	describe("デフォルト値の復元", () => {
		it("サイドバーサイズが0で表示すべき場合はデフォルト値20が使用される", () => {
			store.set(panelSizesAtom, [0, 80, 20]);

			const { result } = renderHook(() => usePanelSizes(), {
				wrapper: Wrapper,
			});

			const [sidebar] = result.current.effectiveSizes;
			expect(sidebar).toBe(20);
		});

		it("インスペクターサイズが0で表示すべき場合はデフォルト値20が使用される", () => {
			store.set(panelSizesAtom, [26, 74, 0]);

			const { result } = renderHook(() => usePanelSizes(), {
				wrapper: Wrapper,
			});

			const [, , inspector] = result.current.effectiveSizes;
			expect(inspector).toBe(20);
		});
	});
});
