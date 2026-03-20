import { describe, expect, it } from "vitest";
import { calcStats } from "./calc-stats";

describe("calcStats", () => {
	describe("空入力", () => {
		it("空文字列はすべて 0", () => {
			const stats = calcStats("");
			expect(stats).toEqual({
				charCount: 0,
				charCountWithSpaces: 0,
				paragraphCount: 0,
				readingMinutes: 0,
			});
		});
	});

	describe("charCount（空白除く）", () => {
		it("半角スペースを除外する", () => {
			expect(calcStats("a b c").charCount).toBe(3);
		});

		it("全角スペースを除外する", () => {
			expect(calcStats("あ　い　う").charCount).toBe(3);
		});

		it("タブを除外する", () => {
			expect(calcStats("あ\tい").charCount).toBe(2);
		});

		it("改行を除外する", () => {
			expect(calcStats("あ\nい\nう").charCount).toBe(3);
		});

		it("連続空白を除外する", () => {
			expect(calcStats("あ   い").charCount).toBe(2);
		});

		it("空白のみの文字列は 0", () => {
			expect(calcStats("   \n\t　").charCount).toBe(0);
		});

		it("日本語テキストの文字数", () => {
			expect(calcStats("吾輩は猫である。").charCount).toBe(8);
		});
	});

	describe("charCountWithSpaces（空白含む）", () => {
		it("空白を含めた文字数", () => {
			expect(calcStats("a b c").charCountWithSpaces).toBe(5);
		});

		it("全角スペースも1文字としてカウント", () => {
			expect(calcStats("あ　い").charCountWithSpaces).toBe(3);
		});

		it("改行も1文字としてカウント", () => {
			expect(calcStats("あ\nい").charCountWithSpaces).toBe(3);
		});
	});

	describe("paragraphCount（段落数）", () => {
		it("1段落のテキスト", () => {
			expect(calcStats("あいう").paragraphCount).toBe(1);
		});

		it("複数段落のテキスト", () => {
			expect(calcStats("段落1\n段落2\n段落3").paragraphCount).toBe(3);
		});

		it("空行を除外する", () => {
			expect(calcStats("段落1\n\n段落2").paragraphCount).toBe(2);
		});

		it("複数の連続空行を除外する", () => {
			expect(calcStats("段落1\n\n\n\n段落2").paragraphCount).toBe(2);
		});

		it("空白のみの行は段落としてカウントしない", () => {
			expect(calcStats("段落1\n   \n段落2").paragraphCount).toBe(2);
		});

		it("末尾の改行は段落を増やさない", () => {
			expect(calcStats("段落1\n段落2\n").paragraphCount).toBe(2);
		});

		it("空白のみの文字列は 0 段落", () => {
			expect(calcStats("   \n\n  ").paragraphCount).toBe(0);
		});
	});

	describe("readingMinutes（読了時間）", () => {
		it("600字で1分", () => {
			const text = "あ".repeat(600);
			expect(calcStats(text).readingMinutes).toBe(1);
		});

		it("601字で2分（切り上げ）", () => {
			const text = "あ".repeat(601);
			expect(calcStats(text).readingMinutes).toBe(2);
		});

		it("1字で1分", () => {
			expect(calcStats("あ").readingMinutes).toBe(1);
		});

		it("空白のみは 0 分", () => {
			expect(calcStats("   ").readingMinutes).toBe(0);
		});
	});

	describe("スクリーンショットの値を再現", () => {
		it("19,465 文字のテキストで読了約33分", () => {
			expect(Math.ceil(19465 / 600)).toBe(33);
		});

		it("文字数と空白含むの差分 = 空白文字数", () => {
			const text = `${"あ".repeat(19465)}${" ".repeat(288)}`;
			const stats = calcStats(text);
			expect(stats.charCount).toBe(19465);
			expect(stats.charCountWithSpaces).toBe(19753);
			expect(stats.readingMinutes).toBe(33);
		});
	});
});
