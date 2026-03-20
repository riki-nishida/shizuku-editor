export type DndItemId<T extends string = string> = {
	type: T;
	id: string;
};

export const buildDndId = <T extends string>(type: T, id: string): string => {
	return `${type}:${id}`;
};

export const parseDndId = <T extends string = string>(
	dndId: string | number,
): DndItemId<T> | null => {
	const idStr = String(dndId);
	const colonIndex = idStr.indexOf(":");

	if (colonIndex === -1) {
		return null;
	}

	const type = idStr.slice(0, colonIndex) as T;
	const id = idStr.slice(colonIndex + 1);

	if (!id) {
		return null;
	}

	return { type, id };
};

export const isDndType = <T extends string>(
	dndId: string | number,
	expectedType: T,
): boolean => {
	const parsed = parseDndId(dndId);
	return parsed?.type === expectedType;
};

export const extractIdIfType = <T extends string>(
	dndId: string | number,
	expectedType: T,
): string | null => {
	const parsed = parseDndId(dndId);
	if (parsed?.type === expectedType) {
		return parsed.id;
	}
	return null;
};
