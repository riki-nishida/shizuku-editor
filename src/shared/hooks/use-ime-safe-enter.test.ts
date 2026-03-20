import { act, renderHook } from "@testing-library/react";
import type { KeyboardEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useIMESafeEnter } from "./use-ime-safe-enter";

describe("useIMESafeEnter", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("初期状態", () => {
		it("必要なハンドラーを返す", () => {
			const onEnter = vi.fn();
			const { result } = renderHook(() => useIMESafeEnter({ onEnter }));

			expect(typeof result.current.handleKeyDown).toBe("function");
			expect(typeof result.current.handleCompositionStart).toBe("function");
			expect(typeof result.current.handleCompositionEnd).toBe("function");
		});
	});

	describe("Enterキー処理", () => {
		it("通常のEnterキーでonEnterが呼ばれる", () => {
			const onEnter = vi.fn();
			const { result } = renderHook(() => useIMESafeEnter({ onEnter }));

			act(() => {
				result.current.handleKeyDown({
					key: "Enter",
					preventDefault: vi.fn(),
					nativeEvent: { isComposing: false },
				} as unknown as KeyboardEvent<HTMLInputElement>);
			});

			expect(onEnter).toHaveBeenCalledTimes(1);
		});

		it("他のキーではonEnterが呼ばれない", () => {
			const onEnter = vi.fn();
			const { result } = renderHook(() => useIMESafeEnter({ onEnter }));

			act(() => {
				result.current.handleKeyDown({
					key: "a",
					preventDefault: vi.fn(),
					nativeEvent: { isComposing: false },
				} as unknown as KeyboardEvent<HTMLInputElement>);
			});

			expect(onEnter).not.toHaveBeenCalled();
		});

		it("EnterキーでpreventDefaultが呼ばれる", () => {
			const onEnter = vi.fn();
			const preventDefault = vi.fn();
			const { result } = renderHook(() => useIMESafeEnter({ onEnter }));

			act(() => {
				result.current.handleKeyDown({
					key: "Enter",
					preventDefault,
					nativeEvent: { isComposing: false },
				} as unknown as KeyboardEvent<HTMLInputElement>);
			});

			expect(preventDefault).toHaveBeenCalled();
		});
	});

	describe("Escapeキー処理", () => {
		it("EscapeキーでonEscapeが呼ばれる", () => {
			const onEnter = vi.fn();
			const onEscape = vi.fn();
			const { result } = renderHook(() =>
				useIMESafeEnter({ onEnter, onEscape }),
			);

			act(() => {
				result.current.handleKeyDown({
					key: "Escape",
					preventDefault: vi.fn(),
					nativeEvent: { isComposing: false },
				} as unknown as KeyboardEvent<HTMLInputElement>);
			});

			expect(onEscape).toHaveBeenCalledTimes(1);
			expect(onEnter).not.toHaveBeenCalled();
		});

		it("onEscapeが未定義でもエラーにならない", () => {
			const onEnter = vi.fn();
			const { result } = renderHook(() => useIMESafeEnter({ onEnter }));

			expect(() => {
				act(() => {
					result.current.handleKeyDown({
						key: "Escape",
						preventDefault: vi.fn(),
						nativeEvent: { isComposing: false },
					} as unknown as KeyboardEvent<HTMLInputElement>);
				});
			}).not.toThrow();
		});
	});

	describe("IME変換中の処理", () => {
		it("IME変換中はEnterでonEnterが呼ばれない (isComposing)", () => {
			const onEnter = vi.fn();
			const { result } = renderHook(() => useIMESafeEnter({ onEnter }));

			act(() => {
				result.current.handleKeyDown({
					key: "Enter",
					preventDefault: vi.fn(),
					nativeEvent: { isComposing: true },
				} as unknown as KeyboardEvent<HTMLInputElement>);
			});

			expect(onEnter).not.toHaveBeenCalled();
		});

		it("compositionStart後はEnterでonEnterが呼ばれない", () => {
			const onEnter = vi.fn();
			const { result } = renderHook(() => useIMESafeEnter({ onEnter }));

			act(() => {
				result.current.handleCompositionStart();
			});

			act(() => {
				result.current.handleKeyDown({
					key: "Enter",
					preventDefault: vi.fn(),
					nativeEvent: { isComposing: false },
				} as unknown as KeyboardEvent<HTMLInputElement>);
			});

			expect(onEnter).not.toHaveBeenCalled();
		});

		it("compositionEnd直後のEnterはスキップされる", () => {
			const onEnter = vi.fn();
			const { result } = renderHook(() => useIMESafeEnter({ onEnter }));

			act(() => {
				result.current.handleCompositionStart();
			});

			act(() => {
				result.current.handleCompositionEnd();
			});

			act(() => {
				result.current.handleKeyDown({
					key: "Enter",
					preventDefault: vi.fn(),
					nativeEvent: { isComposing: false },
				} as unknown as KeyboardEvent<HTMLInputElement>);
			});

			expect(onEnter).not.toHaveBeenCalled();
		});

		it("compositionEnd後の2回目のEnterは処理される", () => {
			const onEnter = vi.fn();
			const { result } = renderHook(() => useIMESafeEnter({ onEnter }));

			act(() => {
				result.current.handleCompositionStart();
			});

			act(() => {
				result.current.handleCompositionEnd();
			});

			act(() => {
				result.current.handleKeyDown({
					key: "Enter",
					preventDefault: vi.fn(),
					nativeEvent: { isComposing: false },
				} as unknown as KeyboardEvent<HTMLInputElement>);
			});

			act(() => {
				result.current.handleKeyDown({
					key: "Enter",
					preventDefault: vi.fn(),
					nativeEvent: { isComposing: false },
				} as unknown as KeyboardEvent<HTMLInputElement>);
			});

			expect(onEnter).toHaveBeenCalledTimes(1);
		});

		it("Processキーは無視される", () => {
			const onEnter = vi.fn();
			const { result } = renderHook(() => useIMESafeEnter({ onEnter }));

			act(() => {
				result.current.handleKeyDown({
					key: "Process",
					preventDefault: vi.fn(),
					nativeEvent: { isComposing: false },
				} as unknown as KeyboardEvent<HTMLInputElement>);
			});

			expect(onEnter).not.toHaveBeenCalled();
		});
	});

	describe("コールバックの参照安定性", () => {
		it("onEnterが変更されても正しく動作する", () => {
			const onEnter1 = vi.fn();
			const onEnter2 = vi.fn();
			const { result, rerender } = renderHook(
				({ onEnter }) => useIMESafeEnter({ onEnter }),
				{ initialProps: { onEnter: onEnter1 } },
			);

			act(() => {
				result.current.handleKeyDown({
					key: "Enter",
					preventDefault: vi.fn(),
					nativeEvent: { isComposing: false },
				} as unknown as KeyboardEvent<HTMLInputElement>);
			});

			expect(onEnter1).toHaveBeenCalledTimes(1);

			rerender({ onEnter: onEnter2 });

			act(() => {
				result.current.handleKeyDown({
					key: "Enter",
					preventDefault: vi.fn(),
					nativeEvent: { isComposing: false },
				} as unknown as KeyboardEvent<HTMLInputElement>);
			});

			expect(onEnter2).toHaveBeenCalledTimes(1);
		});
	});
});
