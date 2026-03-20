CREATE TABLE works (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE chapters (
    id          TEXT PRIMARY KEY,
    work_id     TEXT NOT NULL,
    title       TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_deleted  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(work_id) REFERENCES works(id) ON DELETE CASCADE
);

CREATE INDEX idx_chapters_work_id ON chapters(work_id);
CREATE INDEX idx_chapters_work_deleted ON chapters(work_id, is_deleted);

CREATE TABLE scenes (
    id              TEXT PRIMARY KEY,
    chapter_id      TEXT NOT NULL,
    title           TEXT NOT NULL DEFAULT '',
    synopsis        TEXT NOT NULL DEFAULT '',
    content_text    TEXT NOT NULL DEFAULT '',
    content_markups TEXT NOT NULL DEFAULT '[]',
    sort_order      INTEGER NOT NULL DEFAULT 0,
    word_count      INTEGER NOT NULL DEFAULT 0,
    is_deleted      INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE INDEX idx_scenes_chapter_id ON scenes(chapter_id);
CREATE INDEX idx_scenes_chapter_deleted ON scenes(chapter_id, is_deleted);

CREATE TABLE knowledge_types (
    id          TEXT PRIMARY KEY,
    work_id     TEXT NOT NULL,
    name        TEXT NOT NULL,
    color       TEXT,
    icon        TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(work_id) REFERENCES works(id) ON DELETE CASCADE
);

CREATE INDEX idx_knowledge_types_work_id ON knowledge_types(work_id);

CREATE TABLE knowledge (
    id          TEXT PRIMARY KEY,
    type_id     TEXT NOT NULL,
    title       TEXT NOT NULL,
    body        TEXT NOT NULL DEFAULT '',
    plain_text  TEXT NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(type_id) REFERENCES knowledge_types(id) ON DELETE CASCADE
);

CREATE INDEX idx_knowledge_type_id ON knowledge(type_id);

CREATE TABLE scene_versions (
    id              TEXT PRIMARY KEY,
    scene_id        TEXT NOT NULL,
    content_text    TEXT NOT NULL,
    content_markups TEXT NOT NULL,
    label           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);

CREATE INDEX idx_scene_versions_scene_id ON scene_versions(scene_id);
CREATE INDEX idx_scene_versions_created_at ON scene_versions(scene_id, created_at DESC);

CREATE TABLE scene_knowledge (
    id              TEXT PRIMARY KEY,
    scene_id        TEXT NOT NULL,
    knowledge_id    TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
    FOREIGN KEY(knowledge_id) REFERENCES knowledge(id) ON DELETE CASCADE,
    UNIQUE(scene_id, knowledge_id)
);

CREATE INDEX idx_scene_knowledge_scene_id ON scene_knowledge(scene_id);
CREATE INDEX idx_scene_knowledge_knowledge_id ON scene_knowledge(knowledge_id);

CREATE TABLE scene_images (
    id           TEXT PRIMARY KEY,
    scene_id     TEXT NOT NULL,
    file_path    TEXT NOT NULL,
    file_name    TEXT NOT NULL,
    file_size    INTEGER NOT NULL,
    mime_type    TEXT NOT NULL,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);

CREATE INDEX idx_scene_images_scene_id ON scene_images(scene_id);

CREATE TABLE sync_tombstones (
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    deleted_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY(table_name, record_id)
);

CREATE INDEX idx_sync_tombstones_deleted_at ON sync_tombstones(deleted_at);
