export const DEFAULT_PANEL_SIZES = {
	sidebar: 23,
	main: 54,
	inspector: 23,
} as const;

export const PANEL_CONSTRAINTS = {
	sidebar: { minSize: 18, maxSize: 35 },
	main: { minSize: 40 },
	inspector: { minSize: 18, maxSize: 35 },
} as const;
