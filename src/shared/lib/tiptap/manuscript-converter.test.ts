import type { ContentMarkup } from "tiptap-japanese";
import { describe, expect, it } from "vitest";
import type { SceneData } from "./manuscript-converter";
import { htmlToScenes, scenesToHtml } from "./manuscript-converter";

const createScene = (overrides: Partial<SceneData> = {}): SceneData => ({
	id: "scene-1",
	title: "シーン1",
	contentText: "",
	contentMarkups: [],
	...overrides,
});

describe("manuscript-converter", () => {
	describe("scenesToHtml", () => {
		it("空配列は空の段落を返す", () => {
			expect(scenesToHtml([])).toBe("<p></p>");
		});

		it("単一シーン: テキストのみ", () => {
			const scene = createScene({ contentText: "こんにちは" });
			const html = scenesToHtml([scene]);
			expect(html).toBe("<p>こんにちは</p>");
		});

		it("単一シーン: 複数段落", () => {
			const scene = createScene({ contentText: "一行目\n二行目" });
			const html = scenesToHtml([scene]);
			expect(html).toBe("<p>一行目</p><p>二行目</p>");
		});

		it("単一シーン: 空テキストは空の段落を返す", () => {
			const scene = createScene({ contentText: "" });
			const html = scenesToHtml([scene]);
			expect(html).toBe("<p></p>");
		});

		it("単一シーン: ルビマークアップ", () => {
			const scene = createScene({
				contentText: "漢字のテスト",
				contentMarkups: [{ type: "ruby", start: 0, end: 2, ruby: "かんじ" }],
			});
			const html = scenesToHtml([scene]);
			expect(html).toContain('data-ruby="かんじ"');
			expect(html).toContain("漢字");
		});

		it("単一シーン: 傍点マークアップ", () => {
			const scene = createScene({
				contentText: "強調テスト",
				contentMarkups: [{ type: "emphasis_dot", start: 0, end: 2 }],
			});
			const html = scenesToHtml([scene]);
			expect(html).toContain('data-emphasis-dot="true"');
			expect(html).toContain("強調");
		});

		it("複数シーン: セパレーターが挿入される", () => {
			const scene1 = createScene({
				id: "s1",
				title: "第一幕",
				contentText: "内容1",
			});
			const scene2 = createScene({
				id: "s2",
				title: "第二幕",
				contentText: "内容2",
			});
			const html = scenesToHtml([scene1, scene2]);

			expect(html).toContain('data-type="scene-separator"');
			expect(html).toContain('data-scene-id="s2"');
			expect(html).toContain('data-scene-title="第二幕"');
		});

		it("最初のシーンにはセパレーターがない", () => {
			const scene1 = createScene({ id: "s1", contentText: "A" });
			const scene2 = createScene({ id: "s2", contentText: "B" });
			const html = scenesToHtml([scene1, scene2]);

			expect(html).not.toContain('data-scene-id="s1"');
			expect(html).toContain('data-scene-id="s2"');
		});

		it("3つのシーン: セパレーターが2つ挿入される", () => {
			const scenes = [
				createScene({ id: "s1", title: "A", contentText: "1" }),
				createScene({ id: "s2", title: "B", contentText: "2" }),
				createScene({ id: "s3", title: "C", contentText: "3" }),
			];
			const html = scenesToHtml(scenes);

			const separatorCount = (html.match(/data-type="scene-separator"/g) || [])
				.length;
			expect(separatorCount).toBe(2);
		});

		it("セパレーターの属性値がエスケープされる", () => {
			const scene1 = createScene({ id: "s1", title: "A", contentText: "x" });
			const scene2 = createScene({
				id: 's<2>"',
				title: 'タイトル"特殊"',
				contentText: "y",
			});
			const html = scenesToHtml([scene1, scene2]);
			expect(html).toContain("s&lt;2&gt;&quot;");
			expect(html).toContain("タイトル&quot;特殊&quot;");
		});

		it("複数マークアップが正しく適用される", () => {
			const scene = createScene({
				contentText: "漢字と強調",
				contentMarkups: [
					{ type: "ruby", start: 0, end: 2, ruby: "かんじ" },
					{ type: "emphasis_dot", start: 3, end: 5 },
				],
			});
			const html = scenesToHtml([scene]);
			expect(html).toContain('data-ruby="かんじ"');
			expect(html).toContain('data-emphasis-dot="true"');
		});
	});

	describe("htmlToScenes", () => {
		it("空 HTML は元のシーンをそのまま返す", () => {
			const original = [createScene({ id: "s1", contentText: "test" })];
			const result = htmlToScenes("", original);
			expect(result.scenes).toEqual(original);
			expect(result.modifiedSceneIds.size).toBe(0);
		});

		it("空の段落 HTML は元のシーンをそのまま返す", () => {
			const original = [createScene({ id: "s1", contentText: "test" })];
			const result = htmlToScenes("<p></p>", original);
			expect(result.scenes).toEqual(original);
			expect(result.modifiedSceneIds.size).toBe(0);
		});

		it("変更がないシーンは modifiedSceneIds に含まれない", () => {
			const original = [createScene({ id: "s1", contentText: "テスト" })];
			const html = "<p>テスト</p>";
			const result = htmlToScenes(html, original);
			expect(result.modifiedSceneIds.size).toBe(0);
		});

		it("変更があるシーンは modifiedSceneIds に含まれる", () => {
			const original = [createScene({ id: "s1", contentText: "変更前" })];
			const html = "<p>変更後</p>";
			const result = htmlToScenes(html, original);
			expect(result.modifiedSceneIds.has("s1")).toBe(true);
		});

		it("複数シーンをセパレーターで分割できる", () => {
			const original = [
				createScene({ id: "s1", title: "A", contentText: "" }),
				createScene({ id: "s2", title: "B", contentText: "" }),
			];
			const html =
				'<p>内容1</p><div data-type="scene-separator" data-scene-id="s2" data-scene-title="B"></div><p>内容2</p>';
			const result = htmlToScenes(html, original);

			expect(result.scenes).toHaveLength(2);
			expect(result.scenes[0].contentText).toBe("内容1");
			expect(result.scenes[1].contentText).toBe("内容2");
		});

		it("元のシーンより少ない場合、残りは元のまま保持される", () => {
			const original = [
				createScene({ id: "s1", contentText: "A" }),
				createScene({ id: "s2", contentText: "B" }),
				createScene({ id: "s3", contentText: "C" }),
			];
			const html = "<p>変更A</p>";
			const result = htmlToScenes(html, original);

			expect(result.scenes).toHaveLength(3);
			expect(result.scenes[0].contentText).toBe("変更A");
			expect(result.scenes[1].contentText).toBe("B");
			expect(result.scenes[2].contentText).toBe("C");
		});

		it("シーン ID とタイトルは元のシーンから引き継がれる", () => {
			const original = [
				createScene({ id: "original-id", title: "元のタイトル" }),
			];
			const html = "<p>新しい内容</p>";
			const result = htmlToScenes(html, original);

			expect(result.scenes[0].id).toBe("original-id");
			expect(result.scenes[0].title).toBe("元のタイトル");
		});
	});

	describe("ラウンドトリップ", () => {
		it("テキストのみのラウンドトリップ", () => {
			const original = [
				createScene({ id: "s1", title: "A", contentText: "こんにちは" }),
			];
			const html = scenesToHtml(original);
			const result = htmlToScenes(html, original);

			expect(result.scenes[0].contentText).toBe("こんにちは");
			expect(result.modifiedSceneIds.size).toBe(0);
		});

		it("複数段落のラウンドトリップ", () => {
			const original = [
				createScene({
					id: "s1",
					title: "A",
					contentText: "一行目\n二行目\n三行目",
				}),
			];
			const html = scenesToHtml(original);
			const result = htmlToScenes(html, original);

			expect(result.scenes[0].contentText).toBe("一行目\n二行目\n三行目");
			expect(result.modifiedSceneIds.size).toBe(0);
		});

		it("ルビ付きのラウンドトリップ", () => {
			const markups: ContentMarkup[] = [
				{ type: "ruby", start: 0, end: 2, ruby: "かんじ" },
			];
			const original = [
				createScene({
					id: "s1",
					title: "A",
					contentText: "漢字のテスト",
					contentMarkups: markups,
				}),
			];
			const html = scenesToHtml(original);
			const result = htmlToScenes(html, original);

			expect(result.scenes[0].contentText).toBe("漢字のテスト");
			expect(result.scenes[0].contentMarkups).toEqual(markups);
			expect(result.modifiedSceneIds.size).toBe(0);
		});

		it("傍点付きのラウンドトリップ", () => {
			const markups: ContentMarkup[] = [
				{ type: "emphasis_dot", start: 0, end: 2 },
			];
			const original = [
				createScene({
					id: "s1",
					title: "A",
					contentText: "強調テスト",
					contentMarkups: markups,
				}),
			];
			const html = scenesToHtml(original);
			const result = htmlToScenes(html, original);

			expect(result.scenes[0].contentText).toBe("強調テスト");
			expect(result.scenes[0].contentMarkups).toEqual(markups);
			expect(result.modifiedSceneIds.size).toBe(0);
		});

		it("複数シーンのラウンドトリップ", () => {
			const original = [
				createScene({ id: "s1", title: "第一幕", contentText: "内容1" }),
				createScene({ id: "s2", title: "第二幕", contentText: "内容2" }),
				createScene({ id: "s3", title: "第三幕", contentText: "内容3" }),
			];
			const html = scenesToHtml(original);
			const result = htmlToScenes(html, original);

			expect(result.scenes).toHaveLength(3);
			for (let i = 0; i < 3; i++) {
				expect(result.scenes[i].id).toBe(original[i].id);
				expect(result.scenes[i].contentText).toBe(original[i].contentText);
			}
			expect(result.modifiedSceneIds.size).toBe(0);
		});

		it("複数シーン + マークアップのラウンドトリップ", () => {
			const original = [
				createScene({
					id: "s1",
					title: "A",
					contentText: "漢字を含む文章",
					contentMarkups: [{ type: "ruby", start: 0, end: 2, ruby: "かんじ" }],
				}),
				createScene({
					id: "s2",
					title: "B",
					contentText: "強調される文字",
					contentMarkups: [{ type: "emphasis_dot", start: 0, end: 2 }],
				}),
			];
			const html = scenesToHtml(original);
			const result = htmlToScenes(html, original);

			expect(result.scenes[0].contentMarkups).toEqual(
				original[0].contentMarkups,
			);
			expect(result.scenes[1].contentMarkups).toEqual(
				original[1].contentMarkups,
			);
			expect(result.modifiedSceneIds.size).toBe(0);
		});
	});
});
