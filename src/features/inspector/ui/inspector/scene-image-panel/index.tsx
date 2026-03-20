import {
	addSceneImageAtom,
	deleteSceneImageAtom,
	getSceneImagePath,
	loadSceneImagesAtom,
	type SceneImage,
	sceneImagesAtom,
	sceneImagesLoadingAtom,
} from "@features/write";
import { showConfirmDialog } from "@shared/lib/dialog";
import { useToast } from "@shared/lib/toast";
import { Dialog, useDialog } from "@shared/ui/dialog";
import { IconButton } from "@shared/ui/icon-button";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { MediaImageFolder, Plus, Trash, Xmark } from "iconoir-react";
import { useAtomValue, useSetAtom } from "jotai";
import { type DragEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./styles.module.css";

type SceneImagePanelProps = {
	sceneId: string;
};

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "bmp"];

export const SceneImagePanel = ({ sceneId }: SceneImagePanelProps) => {
	const { t } = useTranslation();
	const images = useAtomValue(sceneImagesAtom);
	const isLoading = useAtomValue(sceneImagesLoadingAtom);
	const loadImages = useSetAtom(loadSceneImagesAtom);
	const addImage = useSetAtom(addSceneImageAtom);
	const deleteImage = useSetAtom(deleteSceneImageAtom);
	const { showSuccess, showError } = useToast();

	const [isDragging, setIsDragging] = useState(false);

	const [selectedImage, setSelectedImage] = useState<SceneImage | null>(null);
	const lightboxDialog = useDialog();

	const [imagePaths, setImagePaths] = useState<Record<string, string>>({});

	const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

	useEffect(() => {
		loadImages(sceneId);
	}, [sceneId, loadImages]);

	useEffect(() => {
		const resolveImages = async () => {
			const paths: Record<string, string> = {};
			for (const image of images) {
				const result = await getSceneImagePath(image.file_path);
				if (result.ok) {
					paths[image.id] = convertFileSrc(result.value);
				}
			}
			setImagePaths(paths);
		};
		resolveImages();
	}, [images]);

	const handleAddImage = useCallback(async () => {
		const selected = await open({
			multiple: true,
			filters: [
				{
					name: "Images",
					extensions: ALLOWED_EXTENSIONS,
				},
			],
		});

		if (selected) {
			const paths = Array.isArray(selected) ? selected : [selected];
			let successCount = 0;
			for (const path of paths) {
				const result = await addImage({ sceneId, sourcePath: path });
				if (result) successCount++;
			}
			if (successCount > 0) {
				showSuccess(t("inspector.images.added", { count: successCount }));
			} else {
				showError(t("inspector.images.addFailed"));
			}
		}
	}, [sceneId, addImage, showSuccess, showError, t]);

	const handleDragEnter = useCallback((e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!e.currentTarget.contains(e.relatedTarget as Node)) {
			setIsDragging(false);
		}
	}, []);

	const handleDragOver = useCallback((e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		async (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			const files = Array.from(e.dataTransfer.files);
			const imageFiles = files.filter((file) => {
				const ext = file.name.split(".").pop()?.toLowerCase();
				return ext && ALLOWED_EXTENSIONS.includes(ext);
			});

			if (imageFiles.length === 0) {
				showError(t("inspector.images.dropImageFiles"));
				return;
			}

			let successCount = 0;
			for (const file of imageFiles) {
				const path = (file as File & { path?: string }).path;
				if (path) {
					const result = await addImage({ sceneId, sourcePath: path });
					if (result) successCount++;
				}
			}

			if (successCount > 0) {
				showSuccess(t("inspector.images.added", { count: successCount }));
			} else {
				showError(t("inspector.images.addFailed"));
			}
		},
		[sceneId, addImage, showSuccess, showError, t],
	);

	const handleImageClick = useCallback(
		(image: SceneImage) => {
			setSelectedImage(image);
			lightboxDialog.setOpen(true);
		},
		[lightboxDialog],
	);

	const handleLightboxClose = useCallback(() => {
		lightboxDialog.setOpen(false);
		setSelectedImage(null);
	}, [lightboxDialog]);

	const handleImageError = useCallback((imageId: string) => {
		setFailedImages((prev) => new Set(prev).add(imageId));
	}, []);

	const handleDeleteImage = useCallback(
		async (imageId: string) => {
			const confirmed = await showConfirmDialog(
				t("inspector.images.deleteConfirm"),
				{
					title: t("inspector.images.deleteTitle"),
					kind: "warning",
				},
			);
			if (!confirmed) return;

			const success = await deleteImage(imageId);
			if (success) {
				showSuccess(t("inspector.images.deleted"));
				setImagePaths((prev) => {
					const next = { ...prev };
					delete next[imageId];
					return next;
				});
			} else {
				showError(t("inspector.images.deleteFailed"));
			}
		},
		[deleteImage, showSuccess, showError, t],
	);

	const formatFileSize = (bytes: number): string => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	return (
		<section
			aria-label={t("inspector.referenceImages")}
			className={`${styles.panel} ${isDragging ? styles.dragging : ""}`}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
		>
			<div className={styles.toolbar}>
				<span className={styles.toolbarTitle}>
					{t("inspector.referenceImages")}
				</span>
				<IconButton
					variant="ghost"
					aria-label={t("inspector.images.addImage")}
					onClick={handleAddImage}
				>
					<Plus width={14} height={14} />
				</IconButton>
			</div>

			{isDragging && (
				<div className={styles.dropOverlay}>
					<span>{t("inspector.images.dropHere")}</span>
				</div>
			)}

			{isLoading ? (
				<div className={styles.loading}>{t("inspector.images.loading")}</div>
			) : images.length === 0 ? (
				<div className={styles.emptyState}>
					<MediaImageFolder
						width={32}
						height={32}
						className={styles.emptyIcon}
					/>
					<p className={styles.emptyText}>{t("inspector.images.noImages")}</p>
					<button
						type="button"
						className={styles.emptyAction}
						onClick={handleAddImage}
					>
						<Plus width={14} height={14} />
						{t("inspector.images.addImage")}
					</button>
				</div>
			) : (
				<div className={styles.grid}>
					{images.map((image) => (
						<div key={image.id} className={styles.imageContainer}>
							{failedImages.has(image.id) ? (
								<div className={styles.imageError}>
									<span>{t("inspector.images.loadError")}</span>
								</div>
							) : imagePaths[image.id] ? (
								<button
									type="button"
									className={styles.imageButton}
									onClick={() => handleImageClick(image)}
								>
									<img
										src={imagePaths[image.id]}
										alt={image.file_name}
										className={styles.image}
										onError={() => handleImageError(image.id)}
									/>
								</button>
							) : (
								<div className={styles.imagePlaceholder} />
							)}
							<div className={styles.imageOverlay}>
								<button
									type="button"
									className={styles.deleteButton}
									onClick={(e) => {
										e.stopPropagation();
										handleDeleteImage(image.id);
									}}
									aria-label={t("common.delete")}
								>
									<Trash width={14} height={14} />
								</button>
							</div>
							<div className={styles.imageInfo}>
								<span className={styles.imageName} title={image.file_name}>
									{image.file_name}
								</span>
								<span className={styles.imageSize}>
									{formatFileSize(image.file_size)}
								</span>
							</div>
						</div>
					))}
				</div>
			)}

			<Dialog.Root value={lightboxDialog}>
				<Dialog.Frame open={lightboxDialog.open}>
					<Dialog.Content className={styles.lightbox}>
						<button
							type="button"
							className={styles.lightboxClose}
							onClick={handleLightboxClose}
							aria-label={t("common.close")}
						>
							<Xmark width={24} height={24} />
						</button>
						{selectedImage && imagePaths[selectedImage.id] && (
							<img
								src={imagePaths[selectedImage.id]}
								alt={selectedImage.file_name}
								className={styles.lightboxImage}
							/>
						)}
						{selectedImage && (
							<div className={styles.lightboxInfo}>
								<span>{selectedImage.file_name}</span>
								<span>{formatFileSize(selectedImage.file_size)}</span>
							</div>
						)}
					</Dialog.Content>
				</Dialog.Frame>
			</Dialog.Root>
		</section>
	);
};
