import { describe, expect, it } from "vitest";
import { shouldAutoIndent } from "./auto-indent";

describe("shouldAutoIndent", () => {
	describe("字下げする（通常の地の文）", () => {
		it("ひらがなで始まる", () => {
			expect(shouldAutoIndent("これは地の文です。")).toBe(true);
		});

		it("カタカナで始まる", () => {
			expect(shouldAutoIndent("カタカナで始まる文。")).toBe(true);
		});

		it("漢字で始まる", () => {
			expect(shouldAutoIndent("彼は歩いた。")).toBe(true);
		});

		it("数字で始まる（年号など）", () => {
			expect(shouldAutoIndent("1984年のことだった。")).toBe(true);
		});

		it("アルファベットで始まる", () => {
			expect(shouldAutoIndent("Aから始まる物語。")).toBe(true);
		});
	});

	describe("字下げしない（空白文字）", () => {
		it("全角スペースで始まる", () => {
			expect(shouldAutoIndent("　手動で字下げ済み")).toBe(false);
		});

		it("半角スペースで始まる", () => {
			expect(shouldAutoIndent(" 半角スペース")).toBe(false);
		});

		it("タブで始まる", () => {
			expect(shouldAutoIndent("\tタブ")).toBe(false);
		});

		it("ノーブレークスペースで始まる", () => {
			expect(shouldAutoIndent(" ノーブレークスペース")).toBe(false);
		});

		it("空白 + 会話開始文字", () => {
			expect(shouldAutoIndent("　「こんにちは」")).toBe(false);
		});
	});

	describe("字下げしない（会話開始文字）", () => {
		it("「で始まる", () => {
			expect(shouldAutoIndent("「こんにちは」")).toBe(false);
		});

		it("『で始まる", () => {
			expect(shouldAutoIndent("『引用文』")).toBe(false);
		});

		it("（で始まる", () => {
			expect(shouldAutoIndent("（補足説明）")).toBe(false);
		});

		it("(で始まる", () => {
			expect(shouldAutoIndent("(parentheses)")).toBe(false);
		});

		it('"で始まる', () => {
			expect(shouldAutoIndent('"Hello"')).toBe(false);
		});

		it("'で始まる", () => {
			expect(shouldAutoIndent("'quote'")).toBe(false);
		});

		it("LEFT DOUBLE QUOTATION MARK で始まる", () => {
			expect(shouldAutoIndent("“Hello”")).toBe(false);
		});

		it("【で始まる", () => {
			expect(shouldAutoIndent("【注意】")).toBe(false);
		});

		it("〈で始まる", () => {
			expect(shouldAutoIndent("〈引用〉")).toBe(false);
		});

		it("《で始まる", () => {
			expect(shouldAutoIndent("《ルビ》")).toBe(false);
		});
	});

	describe("字下げしない（特殊記号）", () => {
		it("EM DASH で始まる", () => {
			expect(shouldAutoIndent("——沈黙が続いた")).toBe(false);
		});

		it("HORIZONTAL BAR で始まる", () => {
			expect(shouldAutoIndent("―そして")).toBe(false);
		});

		it("三点リーダーで始まる", () => {
			expect(shouldAutoIndent("…言葉が出なかった")).toBe(false);
		});

		it("中黒で始まる", () => {
			expect(shouldAutoIndent("・箇条書き項目")).toBe(false);
		});

		it("●で始まる", () => {
			expect(shouldAutoIndent("●重要なポイント")).toBe(false);
		});

		it("※で始まる", () => {
			expect(shouldAutoIndent("※注釈")).toBe(false);
		});

		it("★で始まる", () => {
			expect(shouldAutoIndent("★おすすめ")).toBe(false);
		});

		it("→で始まる", () => {
			expect(shouldAutoIndent("→次のページへ")).toBe(false);
		});

		it("*で始まる", () => {
			expect(shouldAutoIndent("*アスタリスク")).toBe(false);
		});
	});

	describe("字下げしない（空・特殊ケース）", () => {
		it("空文字列", () => {
			expect(shouldAutoIndent("")).toBe(false);
		});

		it("空白のみ", () => {
			expect(shouldAutoIndent("　")).toBe(false);
		});
	});
});
