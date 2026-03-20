import type { RefObject } from "react";
import { useEffect } from "react";

type Params = {
	panelRef: RefObject<HTMLDivElement | null>;
	isVertical: boolean;
};

export const useVerticalScrolling = ({ panelRef, isVertical }: Params) => {
	useEffect(() => {
		if (isVertical && panelRef.current) {
			requestAnimationFrame(() => {
				if (panelRef.current) {
					panelRef.current.scrollLeft = 0;
				}
			});
		}
	}, [isVertical, panelRef]);

	useEffect(() => {
		if (!isVertical) return;
		const panel = panelRef.current;
		if (!panel) return;

		const handleWheel = (e: WheelEvent) => {
			if (e.deltaY !== 0 && e.deltaX === 0) {
				e.preventDefault();
				panel.scrollLeft -= e.deltaY;
			}
		};

		panel.addEventListener("wheel", handleWheel, {
			passive: false,
			capture: true,
		});
		return () =>
			panel.removeEventListener("wheel", handleWheel, { capture: true });
	}, [isVertical, panelRef]);
};
