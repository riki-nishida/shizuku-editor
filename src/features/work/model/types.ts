export type { Work } from "@shared/types";

export type SelectedNode =
	| { type: "chapter"; id: string }
	| { type: "scene"; id: string }
	| { type: "knowledge"; id: string | null }
	| null;
