import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pendingSavesRegistry } from "./pending-saves-registry";

describe("pendingSavesRegistry", () => {
	let registeredSaves: (() => Promise<boolean>)[] = [];

	beforeEach(() => {
		registeredSaves = [];
	});

	afterEach(() => {
		for (const save of registeredSaves) {
			pendingSavesRegistry.unregister(save);
		}
	});

	const registerSave = (save: () => Promise<boolean>) => {
		registeredSaves.push(save);
		pendingSavesRegistry.register(save);
	};

	describe("register / unregister", () => {
		it("保存関数を登録できる", async () => {
			const mockSave = vi.fn().mockResolvedValue(true);
			registerSave(mockSave);

			await pendingSavesRegistry.flushAll();

			expect(mockSave).toHaveBeenCalledTimes(1);
		});

		it("保存関数を解除できる", async () => {
			const mockSave = vi.fn().mockResolvedValue(true);
			registerSave(mockSave);
			pendingSavesRegistry.unregister(mockSave);

			await pendingSavesRegistry.flushAll();

			expect(mockSave).not.toHaveBeenCalled();
		});

		it("同じ関数を複数回登録しても1回だけ実行される", async () => {
			const mockSave = vi.fn().mockResolvedValue(true);
			registerSave(mockSave);
			pendingSavesRegistry.register(mockSave);

			await pendingSavesRegistry.flushAll();

			expect(mockSave).toHaveBeenCalledTimes(1);
		});
	});

	describe("flushAll", () => {
		it("登録された全ての保存関数を実行する", async () => {
			const mockSave1 = vi.fn().mockResolvedValue(true);
			const mockSave2 = vi.fn().mockResolvedValue(true);
			const mockSave3 = vi.fn().mockResolvedValue(false);
			registerSave(mockSave1);
			registerSave(mockSave2);
			registerSave(mockSave3);

			await pendingSavesRegistry.flushAll();

			expect(mockSave1).toHaveBeenCalledTimes(1);
			expect(mockSave2).toHaveBeenCalledTimes(1);
			expect(mockSave3).toHaveBeenCalledTimes(1);
		});

		it("いずれかの保存が実行されたらtrueを返す", async () => {
			const mockSave1 = vi.fn().mockResolvedValue(false);
			const mockSave2 = vi.fn().mockResolvedValue(true);
			registerSave(mockSave1);
			registerSave(mockSave2);

			const result = await pendingSavesRegistry.flushAll();

			expect(result).toBe(true);
		});

		it("全ての保存がfalseを返したらfalseを返す", async () => {
			const mockSave1 = vi.fn().mockResolvedValue(false);
			const mockSave2 = vi.fn().mockResolvedValue(false);
			registerSave(mockSave1);
			registerSave(mockSave2);

			const result = await pendingSavesRegistry.flushAll();

			expect(result).toBe(false);
		});

		it("登録がない場合はfalseを返す", async () => {
			const result = await pendingSavesRegistry.flushAll();

			expect(result).toBe(false);
		});

		it("保存関数がエラーを投げてもfalseとして処理される", async () => {
			const mockSave1 = vi.fn().mockRejectedValue(new Error("Save error"));
			const mockSave2 = vi.fn().mockResolvedValue(true);
			registerSave(mockSave1);
			registerSave(mockSave2);

			const result = await pendingSavesRegistry.flushAll();

			expect(result).toBe(true);
			expect(mockSave1).toHaveBeenCalled();
			expect(mockSave2).toHaveBeenCalled();
		});

		it("1つの保存関数がエラーでも他は実行される", async () => {
			const mockSave1 = vi.fn().mockRejectedValue(new Error("Save error"));
			const mockSave2 = vi.fn().mockResolvedValue(true);
			registerSave(mockSave1);
			registerSave(mockSave2);

			await pendingSavesRegistry.flushAll();

			expect(mockSave2).toHaveBeenCalled();
		});
	});
});
