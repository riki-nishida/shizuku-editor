import { invokeCommand } from "@shared/lib/commands";
import type { AppError } from "@shared/lib/error";
import type { Result } from "@shared/lib/error/result";

export type BackupInfo = {
	filename: string;
	created_at: string;
	size_bytes: number;
};

export const createBackup = async (
	isAuto: boolean,
): Promise<Result<BackupInfo, AppError>> => {
	return invokeCommand<BackupInfo>("create_backup", { isAuto });
};

export const listBackups = async (): Promise<
	Result<BackupInfo[], AppError>
> => {
	return invokeCommand<BackupInfo[]>("list_backups");
};

export const restoreBackup = async (
	backupFilename: string,
): Promise<Result<void, AppError>> => {
	return invokeCommand<void>("restore_backup", { backupFilename });
};

export const deleteBackup = async (
	backupFilename: string,
): Promise<Result<void, AppError>> => {
	return invokeCommand<void>("delete_backup", { backupFilename });
};

export const getBackupDirPath = async (): Promise<Result<string, AppError>> => {
	return invokeCommand<string>("get_backup_dir_path");
};

export const restartApp = async (): Promise<Result<void, AppError>> => {
	return invokeCommand<void>("restart_app");
};
