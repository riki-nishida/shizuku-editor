import { atom } from "jotai";
import type { SelectedNode, Work } from "./types";

export const selectedWorkAtom = atom<Work | null>(null);

export const selectedNodeAtom = atom<SelectedNode>(null);
