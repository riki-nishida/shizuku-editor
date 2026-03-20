import { editorInstanceAtom } from "@features/write/model/editor/store";
import { IconButton } from "@shared/ui/icon-button";
import { Popover } from "@shared/ui/popover";
import { Text } from "iconoir-react";
import { useAtomValue } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

const SYMBOLS = [
	{
		label: "「  」",
		open: "\u300C",
		close: "\u300D",
		descKey: "titleBar.symbols.hookBrackets",
	},
	{
		label: "『  』",
		open: "\u300E",
		close: "\u300F",
		descKey: "titleBar.symbols.doubleHookBrackets",
	},
	{ label: "――", text: "\u2015\u2015", descKey: "titleBar.symbols.dash" },
	{ label: "……", text: "\u2026\u2026", descKey: "titleBar.symbols.ellipsis" },
	{
		label: "〝  〟",
		open: "\u301D",
		close: "\u301F",
		descKey: "titleBar.symbols.nonoKagi",
	},
] as const;

export const SymbolPopover = () => {
	const { t } = useTranslation();
	const editor = useAtomValue(editorInstanceAtom);

	const insertSymbol = useCallback(
		(item: (typeof SYMBOLS)[number]) => {
			if (!editor) return;

			if ("text" in item) {
				editor.chain().focus().insertContent(item.text).run();
				return;
			}

			const { from, to, empty } = editor.state.selection;

			if (!empty) {
				const selectedText = editor.state.doc.textBetween(from, to);
				editor
					.chain()
					.focus()
					.insertContentAt({ from, to }, item.open + selectedText + item.close)
					.run();
			} else {
				editor
					.chain()
					.focus()
					.insertContent(item.open + item.close)
					.run();
				const pos = editor.state.selection.from - 1;
				editor.commands.setTextSelection(pos);
			}
		},
		[editor],
	);

	return (
		<Popover
			tooltip={t("titleBar.insertSymbol")}
			trigger={
				<IconButton aria-label={t("titleBar.insertSymbol")} disabled={!editor}>
					<Text width={16} height={16} />
				</IconButton>
			}
		>
			<div className={styles.grid}>
				{SYMBOLS.map((item) => (
					<button
						key={item.label}
						type="button"
						className={styles.symbolButton}
						onClick={() => insertSymbol(item)}
					>
						<span className={styles.symbolLabel}>{item.label}</span>
						<span className={styles.symbolDesc}>{t(item.descKey)}</span>
					</button>
				))}
			</div>
		</Popover>
	);
};
