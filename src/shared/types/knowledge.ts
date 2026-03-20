export type Knowledge = {
	id: string;
	type_id: string;
	title: string;
	body: string;
	plain_text: string;
	sort_order: number;
	created_at: string;
	updated_at: string;
};

export type KnowledgeOutline = {
	id: string;
	type_id: string;
	title: string;
	sort_order: number;
};

export type KnowledgeSearchResult = {
	id: string;
	type_id: string;
	title: string;
	matched_text: string;
};

export type KnowledgeType = {
	id: string;
	work_id: string;
	name: string;
	color: string | null;
	icon: string | null;
	sort_order: number;
	created_at: string;
	updated_at: string;
};

export type KnowledgeTypeOutline = {
	id: string;
	name: string;
	color: string | null;
	icon: string | null;
	sort_order: number;
	count: number;
};
