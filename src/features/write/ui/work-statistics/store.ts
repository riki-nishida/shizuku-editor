import type { WorkStatistics } from "@shared/types";
import { atom } from "jotai";

export const workStatsAtom = atom<WorkStatistics | null>(null);
