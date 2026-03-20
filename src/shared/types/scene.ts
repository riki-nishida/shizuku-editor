export type Scene = {
	id: string;
	chapter_id: string;
	title: string;
	synopsis: string;
	content_text: string;
	content_markups: string;
	word_count: number;
	sort_order: number;
	is_deleted: boolean;
	created_at: string;
	updated_at: string;
};

export type SceneOutline = {
	id: string;
	chapter_id: string;
	title: string;
	sort_order: number;
	is_deleted: boolean;
	word_count: number;
};

export type ChapterOutline = {
	id: string;
	title: string;
	sort_order: number;
	is_deleted: boolean;
	word_count: number;
};
