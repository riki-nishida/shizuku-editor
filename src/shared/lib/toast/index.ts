import { createToaster } from "@ark-ui/react/toast";
import { useCallback } from "react";

export type ToastType = "success" | "error" | "info";

export type ToastAction = {
	label: string;
	onClick: () => void;
};

export const toaster = createToaster({
	placement: "bottom-end",
	gap: 8,
});

export const useToast = () => {
	const showSuccess = useCallback((message: string, action?: ToastAction) => {
		queueMicrotask(() => {
			toaster.create({
				description: message,
				type: "success",
				meta: { action },
			});
		});
	}, []);

	const showError = useCallback((message: string, action?: ToastAction) => {
		queueMicrotask(() => {
			toaster.create({
				description: message,
				type: "error",
				meta: { action },
			});
		});
	}, []);

	const showInfo = useCallback((message: string, action?: ToastAction) => {
		queueMicrotask(() => {
			toaster.create({
				description: message,
				type: "info",
				meta: { action },
			});
		});
	}, []);

	const showToast = useCallback(
		(toast: {
			message: string;
			type: ToastType;
			action?: ToastAction;
			duration?: number;
		}) => {
			queueMicrotask(() => {
				toaster.create({
					description: toast.message,
					type: toast.type,
					duration: toast.duration,
					meta: { action: toast.action },
				});
			});
		},
		[],
	);

	return {
		showToast,
		showSuccess,
		showError,
		showInfo,
	};
};
