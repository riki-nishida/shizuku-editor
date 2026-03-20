import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInlineInput } from "./use-inline-input";

describe("useInlineInput", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("初期状態", () => {
		it("isAddingがfalseで初期化される", () => {
			const onSubmit = vi.fn();
			const { result } = renderHook(() => useInlineInput({ onSubmit }));

			expect(result.current.isAdding).toBe(false);
		});

		it("valueが空文字で初期化される", () => {
			const onSubmit = vi.fn();
			const { result } = renderHook(() => useInlineInput({ onSubmit }));

			expect(result.current.value).toBe("");
		});
	});

	describe("startAdd", () => {
		it("startAddを呼ぶとisAddingがtrueになる", () => {
			const onSubmit = vi.fn();
			const { result } = renderHook(() => useInlineInput({ onSubmit }));

			act(() => {
				result.current.startAdd();
			});

			expect(result.current.isAdding).toBe(true);
		});

		it("startAddを呼ぶとvalueがリセットされる", () => {
			const onSubmit = vi.fn();
			const { result } = renderHook(() => useInlineInput({ onSubmit }));

			act(() => {
				result.current.startAdd();
				result.current.inputProps.onChange({
					target: { value: "test" },
				} as ChangeEvent<HTMLInputElement>);
			});

			expect(result.current.value).toBe("test");

			act(() => {
				result.current.startAdd();
			});

			expect(result.current.value).toBe("");
		});
	});

	describe("handleCancel", () => {
		it("handleCancelを呼ぶとisAddingがfalseになる", () => {
			const onSubmit = vi.fn();
			const { result } = renderHook(() => useInlineInput({ onSubmit }));

			act(() => {
				result.current.startAdd();
			});

			expect(result.current.isAdding).toBe(true);

			act(() => {
				result.current.handleCancel();
			});

			expect(result.current.isAdding).toBe(false);
		});

		it("handleCancelを呼ぶとvalueがリセットされる", () => {
			const onSubmit = vi.fn();
			const { result } = renderHook(() => useInlineInput({ onSubmit }));

			act(() => {
				result.current.startAdd();
				result.current.inputProps.onChange({
					target: { value: "test" },
				} as ChangeEvent<HTMLInputElement>);
			});

			expect(result.current.value).toBe("test");

			act(() => {
				result.current.handleCancel();
			});

			expect(result.current.value).toBe("");
		});

		it("handleCancelでonCancelコールバックが呼ばれる", () => {
			const onSubmit = vi.fn();
			const onCancel = vi.fn();
			const { result } = renderHook(() =>
				useInlineInput({ onSubmit, onCancel }),
			);

			act(() => {
				result.current.startAdd();
				result.current.handleCancel();
			});

			expect(onCancel).toHaveBeenCalledTimes(1);
		});
	});

	describe("inputProps", () => {
		it("onChangeで値が更新される", () => {
			const onSubmit = vi.fn();
			const { result } = renderHook(() => useInlineInput({ onSubmit }));

			act(() => {
				result.current.startAdd();
				result.current.inputProps.onChange({
					target: { value: "新しい値" },
				} as ChangeEvent<HTMLInputElement>);
			});

			expect(result.current.value).toBe("新しい値");
		});

		it("inputPropsに必要なプロパティが含まれている", () => {
			const onSubmit = vi.fn();
			const { result } = renderHook(() => useInlineInput({ onSubmit }));

			const { inputProps } = result.current;

			expect(inputProps.type).toBe("text");
			expect(inputProps.inputSize).toBe("sm");
			expect(typeof inputProps.onChange).toBe("function");
			expect(typeof inputProps.onKeyDown).toBe("function");
			expect(typeof inputProps.onBlur).toBe("function");
			expect(typeof inputProps.onCompositionStart).toBe("function");
			expect(typeof inputProps.onCompositionEnd).toBe("function");
		});
	});

	describe("submit処理", () => {
		it("空の値でblurするとキャンセルされる", async () => {
			const onSubmit = vi.fn();
			const { result } = renderHook(() => useInlineInput({ onSubmit }));

			act(() => {
				result.current.startAdd();
			});

			await act(async () => {
				result.current.inputProps.onBlur();
			});

			expect(onSubmit).not.toHaveBeenCalled();
			expect(result.current.isAdding).toBe(false);
		});

		it("空白のみの値でblurするとキャンセルされる", async () => {
			const onSubmit = vi.fn();
			const { result } = renderHook(() => useInlineInput({ onSubmit }));

			act(() => {
				result.current.startAdd();
				result.current.inputProps.onChange({
					target: { value: "   " },
				} as ChangeEvent<HTMLInputElement>);
			});

			await act(async () => {
				result.current.inputProps.onBlur();
			});

			expect(onSubmit).not.toHaveBeenCalled();
			expect(result.current.isAdding).toBe(false);
		});

		it("値がある状態でblurするとonSubmitが呼ばれる", async () => {
			const onSubmit = vi.fn().mockResolvedValue(undefined);
			const { result } = renderHook(() => useInlineInput({ onSubmit }));

			act(() => {
				result.current.startAdd();
				result.current.inputProps.onChange({
					target: { value: "テスト値" },
				} as ChangeEvent<HTMLInputElement>);
			});

			await act(async () => {
				result.current.inputProps.onBlur();
			});

			expect(onSubmit).toHaveBeenCalledWith("テスト値");
			expect(result.current.isAdding).toBe(false);
			expect(result.current.value).toBe("");
		});

		it("前後の空白がトリムされてonSubmitが呼ばれる", async () => {
			const onSubmit = vi.fn().mockResolvedValue(undefined);
			const { result } = renderHook(() => useInlineInput({ onSubmit }));

			act(() => {
				result.current.startAdd();
				result.current.inputProps.onChange({
					target: { value: "  トリムテスト  " },
				} as ChangeEvent<HTMLInputElement>);
			});

			await act(async () => {
				result.current.inputProps.onBlur();
			});

			expect(onSubmit).toHaveBeenCalledWith("トリムテスト");
		});

		it("onSuccessコールバックが呼ばれる", async () => {
			const submitResult = { id: 1, name: "test" };
			const onSubmit = vi.fn().mockResolvedValue(submitResult);
			const onSuccess = vi.fn();
			const { result } = renderHook(() =>
				useInlineInput({ onSubmit, onSuccess }),
			);

			act(() => {
				result.current.startAdd();
				result.current.inputProps.onChange({
					target: { value: "テスト" },
				} as ChangeEvent<HTMLInputElement>);
			});

			await act(async () => {
				result.current.inputProps.onBlur();
			});

			expect(onSuccess).toHaveBeenCalledWith(submitResult);
		});
	});

	describe("Enterキー処理", () => {
		it("Enterキーでsubmitされる", async () => {
			const onSubmit = vi.fn().mockResolvedValue(undefined);
			const { result } = renderHook(() => useInlineInput({ onSubmit }));

			act(() => {
				result.current.startAdd();
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
			const { result } = renderHook(() => useInlineInput({ onSubmit }));

			act(() => {
				result.current.startAdd();
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
				useInlineInput({ onSubmit, onCancel }),
			);

			act(() => {
				result.current.startAdd();
				result.current.inputProps.onChange({
					target: { value: "キャンセルテスト" },
				} as ChangeEvent<HTMLInputElement>);
			});

			act(() => {
				result.current.inputProps.onKeyDown({
					key: "Escape",
					preventDefault: vi.fn(),
					nativeEvent: { isComposing: false },
				} as unknown as KeyboardEvent<HTMLInputElement>);
			});

			expect(result.current.isAdding).toBe(false);
			expect(result.current.value).toBe("");
			expect(onCancel).toHaveBeenCalled();
		});
	});

	describe("二重送信防止", () => {
		it("送信中は重複してonSubmitが呼ばれない", async () => {
			let resolveSubmit: () => void;
			const submitPromise = new Promise<void>((resolve) => {
				resolveSubmit = resolve;
			});
			const onSubmit = vi.fn().mockReturnValue(submitPromise);
			const { result } = renderHook(() => useInlineInput({ onSubmit }));

			act(() => {
				result.current.startAdd();
				result.current.inputProps.onChange({
					target: { value: "二重送信テスト" },
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
