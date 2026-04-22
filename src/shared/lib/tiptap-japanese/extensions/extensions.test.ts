import { Editor, type EditorOptions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Annotation } from "./annotation";
import { EmphasisDot } from "./emphasis-dot";
import { Ruby } from "./ruby";
import { TateChuYoko } from "./tate-chu-yoko";

// ---------- helpers ----------

function createEditor(extensions: EditorOptions["extensions"]) {
	return new Editor({
		extensions: [StarterKit, ...extensions],
		content: "<p>テスト文章です</p>",
	});
}

function setSelection(editor: Editor, from: number, to: number) {
	editor.commands.setTextSelection({ from, to });
}

// ---------- Ruby ----------

describe("Ruby extension", () => {
	let editor: Editor;

	beforeEach(() => {
		editor = createEditor([Ruby]);
	});

	afterEach(() => {
		editor.destroy();
	});

	it("エクステンションが正しく登録される", () => {
		expect(
			editor.extensionManager.extensions.some((e) => e.name === "ruby"),
		).toBe(true);
	});

	it("スキーマにrubyマークが登録される", () => {
		expect(editor.schema.marks.ruby).toBeDefined();
	});

	it("setRuby コマンドでルビを設定できる", () => {
		// "テスト" を選択 (pos 1-4 in ProseMirror: <p> takes pos 0)
		setSelection(editor, 1, 4);
		editor.commands.setRuby("てすと");

		const { doc } = editor.state;
		const marks = doc.nodeAt(1)?.marks ?? [];
		expect(marks.length).toBe(1);
		expect(marks[0].type.name).toBe("ruby");
		expect(marks[0].attrs.ruby).toBe("てすと");
	});

	it("unsetRuby コマンドでルビを解除できる", () => {
		setSelection(editor, 1, 4);
		editor.commands.setRuby("てすと");
		setSelection(editor, 1, 4);
		editor.commands.unsetRuby();

		const marks = editor.state.doc.nodeAt(1)?.marks ?? [];
		expect(marks.length).toBe(0);
	});

	it("WYSIWYG モードで ruby/rb/rt 要素としてレンダリングされる", () => {
		setSelection(editor, 1, 4);
		editor.commands.setRuby("てすと");

		const html = editor.getHTML();
		expect(html).toContain("<ruby>");
		expect(html).toContain("<rb>");
		expect(html).toContain("<rt>てすと</rt>");
	});

	it("notation モードで data-ruby 属性のspan としてレンダリングされる", () => {
		editor.destroy();
		editor = createEditor([Ruby.configure({ displayMode: "notation" })]);
		setSelection(editor, 1, 4);
		editor.commands.setRuby("てすと");

		const html = editor.getHTML();
		expect(html).toContain('data-ruby="てすと"');
		expect(html).toContain("ruby-notation");
	});

	it("HTML からルビをパースできる（data-ruby 形式）", () => {
		editor.commands.setContent(
			'<p>今日は<span data-ruby="てんき">天気</span>がいい</p>',
		);

		const { doc } = editor.state;
		// "天気" の位置にルビマークがあることを確認
		let foundRuby = false;
		doc.descendants((node) => {
			for (const mark of node.marks) {
				if (mark.type.name === "ruby" && mark.attrs.ruby === "てんき") {
					foundRuby = true;
				}
			}
		});
		expect(foundRuby).toBe(true);
	});

	it("HTML からルビをパースできる（ruby/rb/rt 形式）", () => {
		editor.commands.setContent(
			"<p>今日は<ruby><rb>天気</rb><rt>てんき</rt></ruby>がいい</p>",
		);

		let foundRuby = false;
		editor.state.doc.descendants((node) => {
			for (const mark of node.marks) {
				if (mark.type.name === "ruby" && mark.attrs.ruby === "てんき") {
					foundRuby = true;
				}
			}
		});
		expect(foundRuby).toBe(true);
	});
});

// ---------- EmphasisDot ----------

describe("EmphasisDot extension", () => {
	let editor: Editor;

	beforeEach(() => {
		editor = createEditor([EmphasisDot]);
	});

	afterEach(() => {
		editor.destroy();
	});

	it("エクステンションが正しく登録される", () => {
		expect(
			editor.extensionManager.extensions.some((e) => e.name === "emphasisDot"),
		).toBe(true);
	});

	it("スキーマにemphasisDotマークが登録される", () => {
		expect(editor.schema.marks.emphasisDot).toBeDefined();
	});

	it("setEmphasisDot コマンドで傍点を設定できる", () => {
		setSelection(editor, 1, 4);
		editor.commands.setEmphasisDot();

		const marks = editor.state.doc.nodeAt(1)?.marks ?? [];
		expect(marks.length).toBe(1);
		expect(marks[0].type.name).toBe("emphasisDot");
	});

	it("unsetEmphasisDot コマンドで傍点を解除できる", () => {
		setSelection(editor, 1, 4);
		editor.commands.setEmphasisDot();
		setSelection(editor, 1, 4);
		editor.commands.unsetEmphasisDot();

		const marks = editor.state.doc.nodeAt(1)?.marks ?? [];
		expect(marks.length).toBe(0);
	});

	it("WYSIWYG モードで emphasis-dot クラスのspan としてレンダリングされる", () => {
		setSelection(editor, 1, 4);
		editor.commands.setEmphasisDot();

		const html = editor.getHTML();
		expect(html).toContain("emphasis-dot");
		expect(html).toContain('data-emphasis-dot="true"');
	});

	it("notation モードで notation クラスのspan としてレンダリングされる", () => {
		editor.destroy();
		editor = createEditor([EmphasisDot.configure({ displayMode: "notation" })]);
		setSelection(editor, 1, 4);
		editor.commands.setEmphasisDot();

		const html = editor.getHTML();
		expect(html).toContain("emphasis-dot-notation");
	});

	it("HTML から傍点をパースできる", () => {
		editor.commands.setContent(
			'<p>これは<span data-emphasis-dot="true">重要</span>です</p>',
		);

		let found = false;
		editor.state.doc.descendants((node) => {
			for (const mark of node.marks) {
				if (mark.type.name === "emphasisDot") {
					found = true;
				}
			}
		});
		expect(found).toBe(true);
	});
});

// ---------- Annotation ----------

describe("Annotation extension", () => {
	let editor: Editor;

	beforeEach(() => {
		editor = createEditor([Annotation]);
	});

	afterEach(() => {
		editor.destroy();
	});

	it("エクステンションが正しく登録される", () => {
		expect(
			editor.extensionManager.extensions.some((e) => e.name === "annotation"),
		).toBe(true);
	});

	it("スキーマにannotationマークが登録される", () => {
		expect(editor.schema.marks.annotation).toBeDefined();
	});

	it("setAnnotation コマンドでアノテーションを設定できる", () => {
		setSelection(editor, 1, 4);
		editor.commands.setAnnotation({ id: "note-1", comment: "確認事項" });

		const marks = editor.state.doc.nodeAt(1)?.marks ?? [];
		expect(marks.length).toBe(1);
		expect(marks[0].type.name).toBe("annotation");
		expect(marks[0].attrs.id).toBe("note-1");
		expect(marks[0].attrs.comment).toBe("確認事項");
	});

	it("updateAnnotationComment コマンドでコメントを更新できる", () => {
		setSelection(editor, 1, 4);
		editor.commands.setAnnotation({ id: "note-1", comment: "元のコメント" });
		editor.commands.updateAnnotationComment("note-1", "更新されたコメント");

		const marks = editor.state.doc.nodeAt(1)?.marks ?? [];
		const annotation = marks.find((m) => m.type.name === "annotation");
		expect(annotation?.attrs.comment).toBe("更新されたコメント");
	});

	it("removeAnnotationById コマンドでIDを指定してアノテーションを削除できる", () => {
		setSelection(editor, 1, 4);
		editor.commands.setAnnotation({ id: "note-1", comment: "削除対象" });
		editor.commands.removeAnnotationById("note-1");

		let found = false;
		editor.state.doc.descendants((node) => {
			for (const mark of node.marks) {
				if (mark.type.name === "annotation" && mark.attrs.id === "note-1") {
					found = true;
				}
			}
		});
		expect(found).toBe(false);
	});

	it("unsetAnnotation コマンドで選択範囲のアノテーションを解除できる", () => {
		setSelection(editor, 1, 4);
		editor.commands.setAnnotation({ id: "note-1", comment: "テスト" });
		setSelection(editor, 1, 4);
		editor.commands.unsetAnnotation();

		const marks = editor.state.doc.nodeAt(1)?.marks ?? [];
		expect(marks.length).toBe(0);
	});

	it("HTML からアノテーションをパースできる", () => {
		editor.commands.setContent(
			'<p>これは<span data-annotation-id="n1" data-annotation-comment="メモ">重要</span>です</p>',
		);

		let foundId = "";
		let foundComment = "";
		editor.state.doc.descendants((node) => {
			for (const mark of node.marks) {
				if (mark.type.name === "annotation") {
					foundId = mark.attrs.id;
					foundComment = mark.attrs.comment;
				}
			}
		});
		expect(foundId).toBe("n1");
		expect(foundComment).toBe("メモ");
	});

	it("annotation-mark クラスでレンダリングされる", () => {
		setSelection(editor, 1, 4);
		editor.commands.setAnnotation({ id: "note-1", comment: "テスト" });

		const html = editor.getHTML();
		expect(html).toContain("annotation-mark");
		expect(html).toContain('data-annotation-id="note-1"');
		expect(html).toContain('data-annotation-comment="テスト"');
	});
});

// ---------- TateChuYoko ----------

describe("TateChuYoko extension", () => {
	let editor: Editor;

	beforeEach(() => {
		editor = createEditor([TateChuYoko]);
	});

	afterEach(() => {
		editor.destroy();
	});

	it("エクステンションが正しく登録される", () => {
		expect(
			editor.extensionManager.extensions.some((e) => e.name === "tateChuYoko"),
		).toBe(true);
	});

	it("スキーマにtateChuYokoマークが登録される", () => {
		expect(editor.schema.marks.tateChuYoko).toBeDefined();
	});

	it("setTateChuYoko コマンドで縦中横を設定できる", () => {
		setSelection(editor, 1, 4);
		editor.commands.setTateChuYoko();

		const marks = editor.state.doc.nodeAt(1)?.marks ?? [];
		expect(marks.length).toBe(1);
		expect(marks[0].type.name).toBe("tateChuYoko");
	});

	it("unsetTateChuYoko コマンドで縦中横を解除できる", () => {
		setSelection(editor, 1, 4);
		editor.commands.setTateChuYoko();
		setSelection(editor, 1, 4);
		editor.commands.unsetTateChuYoko();

		const marks = editor.state.doc.nodeAt(1)?.marks ?? [];
		expect(marks.length).toBe(0);
	});

	it("tate-chu-yoko クラスと data 属性でレンダリングされる", () => {
		setSelection(editor, 1, 4);
		editor.commands.setTateChuYoko();

		const html = editor.getHTML();
		expect(html).toContain("tate-chu-yoko");
		expect(html).toContain('data-tate-chu-yoko="true"');
	});

	it("HTML から縦中横をパースできる（data 属性形式）", () => {
		editor.commands.setContent(
			'<p>令和<span data-tate-chu-yoko="true">7</span>年</p>',
		);

		let found = false;
		editor.state.doc.descendants((node) => {
			for (const mark of node.marks) {
				if (mark.type.name === "tateChuYoko") {
					found = true;
				}
			}
		});
		expect(found).toBe(true);
	});

	it("HTML から縦中横をパースできる（text-combine-upright 形式）", () => {
		editor.commands.setContent(
			'<p>令和<span style="text-combine-upright: all">7</span>年</p>',
		);

		let found = false;
		editor.state.doc.descendants((node) => {
			for (const mark of node.marks) {
				if (mark.type.name === "tateChuYoko") {
					found = true;
				}
			}
		});
		expect(found).toBe(true);
	});

	it("カスタムクラスを設定できる", () => {
		editor.destroy();
		editor = createEditor([TateChuYoko.configure({ tateChuYokoClass: "tcy" })]);
		setSelection(editor, 1, 4);
		editor.commands.setTateChuYoko();

		const html = editor.getHTML();
		expect(html).toContain("tcy");
	});
});

// ---------- 複数マークの共存 ----------

describe("複数マークの共存", () => {
	let editor: Editor;

	beforeEach(() => {
		editor = createEditor([Ruby, EmphasisDot, Annotation, TateChuYoko]);
		editor.commands.setContent("<p>テスト文章です。これは長い文章です。</p>");
	});

	afterEach(() => {
		editor.destroy();
	});

	it("すべてのマークがスキーマに登録される", () => {
		const { marks } = editor.schema;
		expect(marks.ruby).toBeDefined();
		expect(marks.emphasisDot).toBeDefined();
		expect(marks.annotation).toBeDefined();
		expect(marks.tateChuYoko).toBeDefined();
	});

	it("異なる範囲に異なるマークを適用できる", () => {
		// "テスト" にルビ
		setSelection(editor, 1, 4);
		editor.commands.setRuby("てすと");

		// "文章" に傍点
		setSelection(editor, 4, 6);
		editor.commands.setEmphasisDot();

		const doc = editor.state.doc;
		const rubyMarks = doc.nodeAt(1)?.marks ?? [];
		const emphasisMarks = doc.nodeAt(4)?.marks ?? [];

		expect(rubyMarks.some((m) => m.type.name === "ruby")).toBe(true);
		expect(emphasisMarks.some((m) => m.type.name === "emphasisDot")).toBe(true);
	});
});
