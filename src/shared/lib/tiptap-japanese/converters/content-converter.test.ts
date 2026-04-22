import { describe, expect, it } from "vitest";
import {
	contentToHtml,
	htmlToContent,
	parseMarkups,
	serializeMarkups,
} from "./content-converter";

describe("content-converter", () => {
	describe("htmlToContent", () => {
		it("空文字列の場合は空のテキストとマークアップを返す", () => {
			const result = htmlToContent("");
			expect(result).toEqual({ text: "", markups: [] });
		});

		it("空の段落タグの場合は空のテキストとマークアップを返す", () => {
			const result = htmlToContent("<p></p>");
			expect(result).toEqual({ text: "", markups: [] });
		});

		it("プレーンテキストを正しく抽出する", () => {
			const result = htmlToContent("<p>こんにちは</p>");
			expect(result.text).toBe("こんにちは");
			expect(result.markups).toEqual([]);
		});

		it("複数段落を改行で連結する", () => {
			const result = htmlToContent("<p>一行目</p><p>二行目</p>");
			expect(result.text).toBe("一行目\n二行目");
			expect(result.markups).toEqual([]);
		});

		it("brタグを改行として扱う", () => {
			const result = htmlToContent("<p>一行目<br>二行目</p>");
			expect(result.text).toBe("一行目\n二行目");
		});

		it("ルビマークアップを正しく抽出する", () => {
			const result = htmlToContent(
				'<p>今日は<span data-ruby="てんき">天気</span>がいい</p>',
			);
			expect(result.text).toBe("今日は天気がいい");
			expect(result.markups).toEqual([
				{ type: "ruby", start: 3, end: 5, ruby: "てんき" },
			]);
		});

		it("傍点マークアップを正しく抽出する", () => {
			const result = htmlToContent(
				'<p>これは<span data-emphasis-dot="true">重要</span>です</p>',
			);
			expect(result.text).toBe("これは重要です");
			expect(result.markups).toEqual([
				{ type: "emphasis_dot", start: 3, end: 5 },
			]);
		});

		it("複数のマークアップを正しく抽出する", () => {
			const result = htmlToContent(
				'<p><span data-ruby="きょう">今日</span>は<span data-emphasis-dot="true">特別</span>な日</p>',
			);
			expect(result.text).toBe("今日は特別な日");
			expect(result.markups).toEqual([
				{ type: "ruby", start: 0, end: 2, ruby: "きょう" },
				{ type: "emphasis_dot", start: 3, end: 5 },
			]);
		});

		it("段落をまたぐマークアップの位置を正しく計算する", () => {
			const result = htmlToContent(
				'<p>一行目</p><p><span data-ruby="にぎょうめ">二行目</span></p>',
			);
			expect(result.text).toBe("一行目\n二行目");
			expect(result.markups).toEqual([
				{ type: "ruby", start: 4, end: 7, ruby: "にぎょうめ" },
			]);
		});

		it("WYSIWYG モードの ruby 要素を正しく抽出する", () => {
			const result = htmlToContent(
				"<p>今日は<ruby><rb>天気</rb><rt>てんき</rt></ruby>がいい</p>",
			);
			expect(result.text).toBe("今日は天気がいい");
			expect(result.markups).toEqual([
				{ type: "ruby", start: 3, end: 5, ruby: "てんき" },
			]);
		});

		it("WYSIWYG モードの rb なし ruby 要素を正しく抽出する", () => {
			const result = htmlToContent(
				"<p>今日は<ruby>天気<rt>てんき</rt></ruby>がいい</p>",
			);
			expect(result.text).toBe("今日は天気がいい");
			expect(result.markups).toEqual([
				{ type: "ruby", start: 3, end: 5, ruby: "てんき" },
			]);
		});

		it("マークアップを開始位置でソートする", () => {
			const result = htmlToContent(
				'<p><span data-emphasis-dot="true">後</span>の<span data-ruby="まえ">前</span></p>',
			);
			expect(result.markups[0].start).toBeLessThan(result.markups[1].start);
		});

		it("空の段落を含む複数段落を正しく処理する", () => {
			const result = htmlToContent("<p>一行目</p><p></p><p>三行目</p>");
			expect(result.text).toBe("一行目\n\n三行目");
			expect(result.markups).toEqual([]);
		});

		it("連続する空の段落を正しく処理する", () => {
			const result = htmlToContent("<p>一行目</p><p></p><p></p><p>四行目</p>");
			expect(result.text).toBe("一行目\n\n\n四行目");
			expect(result.markups).toEqual([]);
		});
	});

	describe("contentToHtml", () => {
		it("空文字列の場合は空の段落タグを返す", () => {
			const result = contentToHtml("", []);
			expect(result).toBe("<p></p>");
		});

		it("プレーンテキストを段落タグで囲む", () => {
			const result = contentToHtml("こんにちは", []);
			expect(result).toBe("<p>こんにちは</p>");
		});

		it("改行で複数段落に分割する", () => {
			const result = contentToHtml("一行目\n二行目", []);
			expect(result).toBe("<p>一行目</p><p>二行目</p>");
		});

		it("ルビマークアップを正しくHTMLに変換する", () => {
			const result = contentToHtml("今日は天気がいい", [
				{ type: "ruby", start: 3, end: 5, ruby: "てんき" },
			]);
			expect(result).toBe(
				'<p>今日は<span data-ruby="てんき">天気</span>がいい</p>',
			);
		});

		it("傍点マークアップを正しくHTMLに変換する", () => {
			const result = contentToHtml("これは重要です", [
				{ type: "emphasis_dot", start: 3, end: 5 },
			]);
			expect(result).toBe(
				'<p>これは<span data-emphasis-dot="true">重要</span>です</p>',
			);
		});

		it("複数のマークアップを正しく変換する", () => {
			const result = contentToHtml("今日は特別な日", [
				{ type: "ruby", start: 0, end: 2, ruby: "きょう" },
				{ type: "emphasis_dot", start: 3, end: 5 },
			]);
			expect(result).toBe(
				'<p><span data-ruby="きょう">今日</span>は<span data-emphasis-dot="true">特別</span>な日</p>',
			);
		});

		it("マークアップ対象テキスト内の特殊文字をエスケープする", () => {
			const result = contentToHtml("<test>&value", [
				{ type: "emphasis_dot", start: 0, end: 6 },
			]);
			expect(result).toBe(
				'<p><span data-emphasis-dot="true">&lt;test&gt;</span>&value</p>',
			);
		});

		it("ルビテキスト内の特殊文字をエスケープする", () => {
			const result = contentToHtml("テスト", [
				{ type: "ruby", start: 0, end: 3, ruby: '<script>"test"</script>' },
			]);
			expect(result).toContain("&lt;script&gt;");
			expect(result).toContain("&quot;");
		});

		it("改行を含むテキストでマークアップの位置を正しく処理する", () => {
			const result = contentToHtml("一行目\n二行目", [
				{ type: "ruby", start: 4, end: 7, ruby: "にぎょうめ" },
			]);
			expect(result).toBe(
				'<p>一行目</p><p><span data-ruby="にぎょうめ">二行目</span></p>',
			);
		});

		it("空の段落（連続改行）を正しく変換する", () => {
			const result = contentToHtml("一行目\n\n三行目", []);
			expect(result).toBe("<p>一行目</p><p></p><p>三行目</p>");
		});

		it("連続する空の段落を正しく変換する", () => {
			const result = contentToHtml("一行目\n\n\n四行目", []);
			expect(result).toBe("<p>一行目</p><p></p><p></p><p>四行目</p>");
		});
	});

	describe("htmlToContent と contentToHtml の往復変換", () => {
		it("プレーンテキストの往復変換", () => {
			const originalHtml = "<p>こんにちは世界</p>";
			const content = htmlToContent(originalHtml);
			const resultHtml = contentToHtml(content.text, content.markups);
			expect(resultHtml).toBe(originalHtml);
		});

		it("ルビ付きテキストの往復変換", () => {
			const originalHtml =
				'<p>今日は<span data-ruby="てんき">天気</span>がいい</p>';
			const content = htmlToContent(originalHtml);
			const resultHtml = contentToHtml(content.text, content.markups);
			expect(resultHtml).toBe(originalHtml);
		});

		it("傍点付きテキストの往復変換", () => {
			const originalHtml =
				'<p>これは<span data-emphasis-dot="true">重要</span>です</p>';
			const content = htmlToContent(originalHtml);
			const resultHtml = contentToHtml(content.text, content.markups);
			expect(resultHtml).toBe(originalHtml);
		});

		it("複数マークアップの往復変換", () => {
			const originalHtml =
				'<p><span data-ruby="きょう">今日</span>は<span data-emphasis-dot="true">特別</span>な日</p>';
			const content = htmlToContent(originalHtml);
			const resultHtml = contentToHtml(content.text, content.markups);
			expect(resultHtml).toBe(originalHtml);
		});

		it("複数段落の往復変換", () => {
			const originalHtml = "<p>一行目</p><p>二行目</p><p>三行目</p>";
			const content = htmlToContent(originalHtml);
			const resultHtml = contentToHtml(content.text, content.markups);
			expect(resultHtml).toBe(originalHtml);
		});

		it("段落をまたぐマークアップの往復変換", () => {
			const originalHtml =
				'<p>一行目</p><p><span data-ruby="にぎょうめ">二行目</span></p>';
			const content = htmlToContent(originalHtml);
			const resultHtml = contentToHtml(content.text, content.markups);
			expect(resultHtml).toBe(originalHtml);
		});

		it("空の段落を含むテキストの往復変換", () => {
			const originalHtml = "<p>一行目</p><p></p><p>三行目</p>";
			const content = htmlToContent(originalHtml);
			const resultHtml = contentToHtml(content.text, content.markups);
			expect(resultHtml).toBe(originalHtml);
		});

		it("連続する空の段落の往復変換", () => {
			const originalHtml = "<p>一行目</p><p></p><p></p><p>四行目</p>";
			const content = htmlToContent(originalHtml);
			const resultHtml = contentToHtml(content.text, content.markups);
			expect(resultHtml).toBe(originalHtml);
		});
	});

	describe("serializeMarkups", () => {
		it("空配列をJSON文字列に変換する", () => {
			const result = serializeMarkups([]);
			expect(result).toBe("[]");
		});

		it("ルビマークアップをJSON文字列に変換する", () => {
			const markups = [
				{ type: "ruby" as const, start: 0, end: 2, ruby: "きょう" },
			];
			const result = serializeMarkups(markups);
			expect(JSON.parse(result)).toEqual(markups);
		});

		it("傍点マークアップをJSON文字列に変換する", () => {
			const markups = [{ type: "emphasis_dot" as const, start: 0, end: 2 }];
			const result = serializeMarkups(markups);
			expect(JSON.parse(result)).toEqual(markups);
		});

		it("複数のマークアップをJSON文字列に変換する", () => {
			const markups = [
				{ type: "ruby" as const, start: 0, end: 2, ruby: "きょう" },
				{ type: "emphasis_dot" as const, start: 3, end: 5 },
			];
			const result = serializeMarkups(markups);
			expect(JSON.parse(result)).toEqual(markups);
		});
	});

	describe("parseMarkups", () => {
		it("空文字列の場合は空配列を返す", () => {
			const result = parseMarkups("");
			expect(result).toEqual([]);
		});

		it("空配列のJSON文字列を空配列に変換する", () => {
			const result = parseMarkups("[]");
			expect(result).toEqual([]);
		});

		it("ルビマークアップのJSONをパースする", () => {
			const json = '[{"type":"ruby","start":0,"end":2,"ruby":"きょう"}]';
			const result = parseMarkups(json);
			expect(result).toEqual([
				{ type: "ruby", start: 0, end: 2, ruby: "きょう" },
			]);
		});

		it("傍点マークアップのJSONをパースする", () => {
			const json = '[{"type":"emphasis_dot","start":0,"end":2}]';
			const result = parseMarkups(json);
			expect(result).toEqual([{ type: "emphasis_dot", start: 0, end: 2 }]);
		});

		it("不正なJSONの場合は空配列を返す", () => {
			const result = parseMarkups("invalid json");
			expect(result).toEqual([]);
		});

		it("nullやundefinedの場合は空配列を返す", () => {
			expect(parseMarkups(null as unknown as string)).toEqual([]);
			expect(parseMarkups(undefined as unknown as string)).toEqual([]);
		});

		it("配列でないJSONの場合は空配列を返す", () => {
			expect(parseMarkups('{"type":"ruby"}')).toEqual([]);
			expect(parseMarkups('"hello"')).toEqual([]);
		});

		it("不正な構造のオブジェクトをフィルタリングする", () => {
			const json =
				'[{"type":"ruby","start":0,"end":2,"ruby":"きょう"},{"type":"unknown","start":0,"end":1},{"bad":true}]';
			const result = parseMarkups(json);
			expect(result).toEqual([
				{ type: "ruby", start: 0, end: 2, ruby: "きょう" },
			]);
		});

		it("rubyにrubyフィールドがない場合はフィルタリングする", () => {
			const json = '[{"type":"ruby","start":0,"end":2}]';
			expect(parseMarkups(json)).toEqual([]);
		});

		it("annotationにid/commentがない場合はフィルタリングする", () => {
			const json = '[{"type":"annotation","start":0,"end":2}]';
			expect(parseMarkups(json)).toEqual([]);
		});
	});

	describe("serializeMarkups と parseMarkups の往復変換", () => {
		it("空配列の往復変換", () => {
			const original: [] = [];
			const serialized = serializeMarkups(original);
			const parsed = parseMarkups(serialized);
			expect(parsed).toEqual(original);
		});

		it("マークアップ配列の往復変換", () => {
			const original = [
				{ type: "ruby" as const, start: 0, end: 2, ruby: "きょう" },
				{ type: "emphasis_dot" as const, start: 3, end: 5 },
			];
			const serialized = serializeMarkups(original);
			const parsed = parseMarkups(serialized);
			expect(parsed).toEqual(original);
		});
	});
});
