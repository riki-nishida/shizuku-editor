import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInlineRename } from "./use-inline-rename";

describe("useInlineRename", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("初期状態", () => {
		it("initialValueで初期化される", () => {
			const onSubmit = vi.fn();
			const onCancel = vi.fn();
			const { result } = renderHook(() =>
				useInlineRename({
					initialValue: "初期値",
					isEditing: false,
					onSubmit,
					onCancel,
				}),
			);

			expect(result.current.value).toBe("初期値");
		});

		it("必要なプロパティを返す", () => {
			const onSubmit = vi.fn();
			const onCancel = vi.fn();
			const { result } = renderHook(() =>
				useInlineRename({
					initialValue: "test",
					isEditing: false,
					onSubmit,
					onCancel,
				}),
			);

			expect(result.current.value).toBeDefined();
			expect(result.current.inputRef).toBeDefined();
			expect(result.current.inputProps).toBeDefined();
		});

		it("inputPropsに必要なプロパティが含まれている", () => {
			const onSubmit = vi.fn();
			const onCancel = vi.fn();
			const { result } = renderHook(() =>
				useInlineRename({
					initialValue: "test",
					isEditing: false,
					onSubmit,
					onCancel,
				}),
			);

			const { inputProps } = result.current;
			expect(inputProps.type).toBe("text");
			expect(typeof inputProps.onChange).toBe("function");
			expect(typeof inputProps.onKeyDown).toBe("function");
			expect(typeof inputProps.onBlur).toBe("function");
			expect(typeof inputProps.onCompositionStart).toBe("function");
			expect(typeof inputProps.onCompositionEnd).toBe("function");
		});
	});

	describe("initialValue変更時", () => {
		it("initialValueが変わるとvalueも更新される", () => {
			const onSubmit = vi.fn();
			const onCancel = vi.fn();
			const { result, rerender } = renderHook(
				({ initialValue }) =>
					useInlineRename({
						initialValue,
						isEditing: false,
						onSubmit,
						onCancel,
					}),
				{ initialProps: { initialValue: "初期値" } },
			);

			expect(result.current.value).toBe("初期値");

			rerender({ initialValue: "新しい値" });

			expect(result.current.value).toBe("新しい値");
		});
	});

	describe("isEditing変更時", () => {
		it("isEditingがtrueになるとinputにフォーカスとセレクトが行われる", () => {
			const onSubmit = vi.fn();
			const onCancel = vi.fn();
			const focusMock = vi.fn();
			const selectMock = vi.fn();

			const { result, rerender } = renderHook(
				({ isEditing }) =>
					useInlineRename({
						initialValue: "test",
						isEditing,
						onSubmit,
						onCancel,
					}),
				{ initialProps: { isEditing: false } },
			);

			Object.defineProperty(result.current.inputRef, "current", {
				value: { focus: focusMock, select: selectMock },
				writable: true,
			});

			rerender({ isEditing: true });

			expect(focusMock).toHaveBeenCalled();
			expect(selectMock).toHaveBeenCalled();
		});
	});

	describe("値の変更", () => {
		it("onChangeで値が更新される", () => {
			const onSubmit = vi.fn();
			const onCancel = vi.fn();
			const { result } = renderHook(() =>
				useInlineRename({
					initialValue: "初期値",
					isEditing: true,
					onSubmit,
					onCancel,
				}),
			);

			act(() => {
				result.current.inputProps.onChange({
					target: { value: "新しい値" },
				} as ChangeEvent<HTMLInputElement>);
			});

			expect(result.current.value).toBe("新しい値");
		});
	});

	describe("submit処理", () => {
		it("値が変更されている場合、blurでonSubmitが呼ばれる", async () => {
			const onSubmit = vi.fn().mockResolvedValue(undefined);
			const onCancel = vi.fn();
			const { result } = renderHook(() =>
				useInlineRename({
					initialValue: "初期値",
					isEditing: true,
					onSubmit,
					onCancel,
				}),
			);

			act(() => {
				result.current.inputProps.onChange({
					target: { value: "新しい値" },
				} as ChangeEvent<HTMLInputElement>);
			});

			await act(async () => {
				result.current.inputProps.onBlur();
			});

			expect(onSubmit).toHaveBeenCalledWith("新しい値");
			expect(onCancel).not.toHaveBeenCalled();
		});

		it("値にトリムが適用される", async () => {
			const onSubmit = vi.fn().mockResolvedValue(undefined);
			const onCancel = vi.fn();
			const { result } = renderHook(() =>
				useInlineRename({
					initialValue: "初期値",
					isEditing: true,
					onSubmit,
					onCancel,
				}),
			);

			act(() => {
				result.current.inputProps.onChange({
					target: { value: "  空白付き  " },
				} as ChangeEvent<HTMLInputElement>);
			});

			await act(async () => {
				result.current.inputProps.onBlur();
			});

			expect(onSubmit).toHaveBeenCalledWith("空白付き");
		});

		it("値が変更されていない場合はonCancelが呼ばれる", async () => {
			const onSubmit = vi.fn().mockResolvedValue(undefined);
			const onCancel = vi.fn();
			const { result } = renderHook(() =>
				useInlineRename({
					initialValue: "初期値",
					isEditing: true,
					onSubmit,
					onCancel,
				}),
			);

			await act(async () => {
				result.current.inputProps.onBlur();
			});

			expect(onSubmit).not.toHaveBeenCalled();
			expect(onCancel).toHaveBeenCalled();
		});

		it("空白のみに変更した場合はonCancelが呼ばれる", async () => {
			const onSubmit = vi.fn().mockResolvedValue(undefined);
			const onCancel = vi.fn();
			const { result } = renderHook(() =>
				useInlineRename({
					initialValue: "",
					isEditing: true,
					onSubmit,
					onCancel,
				}),
			);

			act(() => {
				result.current.inputProps.onChange({
					target: { value: "   " },
				} as ChangeEvent<HTMLInputElement>);
			});

			await act(async () => {
				result.current.inputProps.onBlur();
			});

			expect(onCancel).toHaveBeenCalled();
		});
	});

	describe("Enterキー処理", () => {
		it("Enterキーでsubmitされる", async () => {
			const onSubmit = vi.fn().mockResolvedValue(undefined);
			const onCancel = vi.fn();
			const { result } = renderHook(() =>
				useInlineRename({
					initialValue: "初期値",
					isEditing: true,
					onSubmit,
					onCancel,
				}),
			);

			act(() => {
				result.current.inputProps.onChange({
					target: { value: "Enterテスト" },
				} as ChangeEvent<HTMLInputElement>);
			});

			await act(async () => {
				result.current.inputProps.onKeyDown({
					key: "Enter",
					preventDefault: vi.fn(),
					nativeEvent: { isComposing: false },
				} as unknown as KeyboardEvent<HTMLInputElement>);
			});

			expect(onSubmit).toHaveBeenCalledWith("Enterテスト");
		});

		it("IME変換中はEnterでsubmitされない", async () => {
			const onSubmit = vi.fn().mockResolvedValue(undefined);
			const onCancel = vi.fn();
			const { result } = renderHook(() =>
				useInlineRename({
					initialValue: "初期値",
					isEditing: true,
					onSubmit,
					onCancel,
				}),
			);

			act(() => {
				result.current.inputProps.onChange({
					target: { value: "IMEテスト" },
				} as ChangeEvent<HTMLInputElement>);
				result.current.inputProps.onCompositionStart();
			});

			await act(async () => {
				result.current.inputProps.onKeyDown({
					key: "Enter",
					preventDefault: vi.fn(),
					nativeEvent: { isComposing: true },
				} as unknown as KeyboardEvent<HTMLInputElement>);
			});

			expect(onSubmit).not.toHaveBeenCalled();
		});
	});

	describe("Escapeキー処理", () => {
		it("Escapeキーでキャンセルされる", () => {
			const onSubmit = vi.fn();
			const onCancel = vi.fn();
			const { result } = renderHook(() =>
				useInlineRename({
					initialValue: "初期値",
					isEditing: true,
					onSubmit,
					onCancel,
				}),
			);

			act(() => {
				result.current.inputProps.onChange({
					target: { value: "変更値" },
				} as ChangeEvent<HTMLInputElement>);
			});

			act(() => {
				result.current.inputProps.onKeyDown({
					key: "Escape",
					preventDefault: vi.fn(),
					nativeEvent: { isComposing: false },
				} as unknown as KeyboardEvent<HTMLInputElement>);
			});

			expect(onCancel).toHaveBeenCalled();
			expect(result.current.value).toBe("初期値");
		});
	});

	describe("二重送信防止", () => {
		it("送信中は重複してonSubmitが呼ばれない", async () => {
			let resolveSubmit: () => void;
			const submitPromise = new Promise<void>((resolve) => {
				resolveSubmit = resolve;
			});
			const onSubmit = vi.fn().mockReturnValue(submitPromise);
			const onCancel = vi.fn();
			const { result } = renderHook(() =>
				useInlineRename({
					initialValue: "初期値",
					isEditing: true,
					onSubmit,
					onCancel,
				}),
			);

			act(() => {
				result.current.inputProps.onChange({
					target: { value: "新しい値" },
				} as ChangeEvent<HTMLInputElement>);
			});

			act(() => {
				result.current.inputProps.onBlur();
			});

			act(() => {
				result.current.inputProps.onBlur();
			});

			expect(onSubmit).toHaveBeenCalledTimes(1);

			await act(async () => {
				resolveSubmit();
				await submitPromise;
			});
		});
	});
});
