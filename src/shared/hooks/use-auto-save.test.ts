import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pendingSavesRegistry } from "./pending-saves-registry";
import { useAutoSave } from "./use-auto-save";

vi.mock("@shared/lib/toast", () => ({
	useToast: () => ({ showError: vi.fn() }),
}));

describe("useAutoSave", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	describe("自動保存", () => {
		it("2秒後に自動保存される", async () => {
			const onSave = vi.fn().mockResolvedValue(undefined);
			const { rerender } = renderHook(
				({ value }) =>
					useAutoSave({
						value,
						itemId: 1,
						onSave,
					}),
				{ initialProps: { value: "initial" } },
			);

			rerender({ value: "changed" });

			expect(onSave).not.toHaveBeenCalled();

			await act(async () => {
				vi.advanceTimersByTime(2000);
			});

			expect(onSave).toHaveBeenCalledWith("changed");
		});

		it("変更がない場合は保存されない", async () => {
			const onSave = vi.fn().mockResolvedValue(undefined);
			renderHook(() =>
				useAutoSave({
					value: "initial",
					itemId: 1,
					onSave,
				}),
			);

			await act(async () => {
				vi.advanceTimersByTime(2000);
			});

			expect(onSave).not.toHaveBeenCalled();
		});
	});

	describe("手動保存 (handleSave)", () => {
		it("handleSaveで即座に保存される", async () => {
			const onSave = vi.fn().mockResolvedValue(undefined);
			const { result, rerender } = renderHook(
				({ value }) =>
					useAutoSave({
						value,
						itemId: 1,
						onSave,
					}),
				{ initialProps: { value: "initial" } },
			);

			rerender({ value: "changed" });

			await act(async () => {
				await result.current.handleSave();
			});

			expect(onSave).toHaveBeenCalledWith("changed");
		});
	});

	describe("アイテム切り替え", () => {
		it("itemId変更時に未保存の変更が保存される", async () => {
			const onSave = vi.fn().mockResolvedValue(undefined);
			const { rerender } = renderHook(
				({ value, itemId }) =>
					useAutoSave({
						value,
						itemId,
						onSave,
					}),
				{ initialProps: { value: "initial", itemId: 1 } },
			);

			rerender({ value: "changed", itemId: 1 });

			rerender({ value: "new item value", itemId: 2 });

			expect(onSave).toHaveBeenCalledWith("changed");
		});

		it("itemId変更時に古いonSaveで保存される（新しいonSaveではない）", async () => {
			const onSaveForItem1 = vi.fn().mockResolvedValue(undefined);
			const onSaveForItem2 = vi.fn().mockResolvedValue(undefined);

			const { rerender } = renderHook(
				({ value, itemId, onSave }) =>
					useAutoSave({
						value,
						itemId,
						onSave,
					}),
				{
					initialProps: {
						value: "item1 initial",
						itemId: 1,
						onSave: onSaveForItem1,
					},
				},
			);

			rerender({
				value: "item1 changed",
				itemId: 1,
				onSave: onSaveForItem1,
			});

			rerender({
				value: "item2 initial",
				itemId: 2,
				onSave: onSaveForItem2,
			});

			expect(onSaveForItem1).toHaveBeenCalledWith("item1 changed");
			expect(onSaveForItem2).not.toHaveBeenCalled();
		});

		it("切り替え後の自動保存は新しいonSaveで行われる", async () => {
			const onSaveForItem1 = vi.fn().mockResolvedValue(undefined);
			const onSaveForItem2 = vi.fn().mockResolvedValue(undefined);

			const { rerender } = renderHook(
				({ value, itemId, onSave }) =>
					useAutoSave({
						value,
						itemId,
						onSave,
					}),
				{
					initialProps: {
						value: "item1 initial",
						itemId: 1,
						onSave: onSaveForItem1,
					},
				},
			);

			rerender({
				value: "item2 initial",
				itemId: 2,
				onSave: onSaveForItem2,
			});

			rerender({
				value: "item2 changed",
				itemId: 2,
				onSave: onSaveForItem2,
			});

			await act(async () => {
				vi.advanceTimersByTime(2000);
			});

			expect(onSaveForItem2).toHaveBeenCalledWith("item2 changed");
		});
	});

	describe("クリーンアップ", () => {
		it("アンマウント時に未保存の変更が保存される", async () => {
			const onSave = vi.fn().mockResolvedValue(undefined);
			const { rerender, unmount } = renderHook(
				({ value }) =>
					useAutoSave({
						value,
						itemId: 1,
						onSave,
					}),
				{ initialProps: { value: "initial" } },
			);

			rerender({ value: "changed" });

			unmount();

			expect(onSave).toHaveBeenCalledWith("changed");
		});
	});

	describe("レジストリ連携", () => {
		it("マウント時にレジストリに登録され、アンマウント時に解除される", async () => {
			const onSave = vi.fn().mockResolvedValue(undefined);
			const { unmount } = renderHook(() =>
				useAutoSave({
					value: "initial",
					itemId: 1,
					onSave,
				}),
			);

			const saved = await pendingSavesRegistry.flushAll();
			expect(saved).toBe(false);

			unmount();
		});

		it("flushAllで未保存の変更が保存される", async () => {
			const onSave = vi.fn().mockResolvedValue(undefined);
			const { rerender, unmount } = renderHook(
				({ value }) =>
					useAutoSave({
						value,
						itemId: 1,
						onSave,
					}),
				{ initialProps: { value: "initial" } },
			);

			rerender({ value: "changed" });

			const saved = await pendingSavesRegistry.flushAll();
			expect(saved).toBe(true);
			expect(onSave).toHaveBeenCalledWith("changed");

			unmount();
		});

		it("flushAll後は変更がないのでfalseを返す", async () => {
			const onSave = vi.fn().mockResolvedValue(undefined);
			const { rerender, unmount } = renderHook(
				({ value }) =>
					useAutoSave({
						value,
						itemId: 1,
						onSave,
					}),
				{ initialProps: { value: "initial" } },
			);

			rerender({ value: "changed" });

			const saved1 = await pendingSavesRegistry.flushAll();
			expect(saved1).toBe(true);

			const saved2 = await pendingSavesRegistry.flushAll();
			expect(saved2).toBe(false);

			unmount();
		});
	});
});
