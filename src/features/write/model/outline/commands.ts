import { invokeCommand } from "@shared/lib/commands";
import type { WorkOutline, WorkStatistics } from "@shared/types";

export const getWorkOutline = (workId: string) => {
	return invokeCommand<WorkOutline>("get_work_outline", {
		workId,
	});
};

export const getWorkStatistics = (workId: string) => {
	return invokeCommand<WorkStatistics>("get_work_statistics", {
		workId,
	});
};
