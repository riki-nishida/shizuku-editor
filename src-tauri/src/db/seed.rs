use std::sync::LazyLock;

use anyhow::Result;
use regex::Regex;
use sqlx::query;
use uuid::Uuid;

use crate::models::settings::Language;

use super::DbPool;

static RE_HTML_TAG: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"<[^>]+>").unwrap());

pub struct DefaultKnowledgeType {
    pub name: &'static str,
    pub icon: &'static str,
}

const DEFAULT_KNOWLEDGE_TYPES_JA: &[DefaultKnowledgeType] = &[
    DefaultKnowledgeType {
        name: "登場人物",
        icon: "User",
    },
    DefaultKnowledgeType {
        name: "世界観",
        icon: "Globe",
    },
    DefaultKnowledgeType {
        name: "場所",
        icon: "MapPin",
    },
];

const DEFAULT_KNOWLEDGE_TYPES_EN: &[DefaultKnowledgeType] = &[
    DefaultKnowledgeType {
        name: "Characters",
        icon: "User",
    },
    DefaultKnowledgeType {
        name: "World",
        icon: "Globe",
    },
    DefaultKnowledgeType {
        name: "Places",
        icon: "MapPin",
    },
];

fn default_knowledge_types(language: &Language) -> &'static [DefaultKnowledgeType] {
    match language {
        Language::En => DEFAULT_KNOWLEDGE_TYPES_EN,
        Language::Ja => DEFAULT_KNOWLEDGE_TYPES_JA,
    }
}

pub struct CustomKnowledgeType {
    pub name: &'static str,
    pub color: Option<&'static str>,
    pub icon: Option<&'static str>,
}

pub struct SampleScene {
    pub title: &'static str,
    pub synopsis: &'static str,
    pub body: &'static str,
}

pub struct SampleChapter {
    pub title: &'static str,
    pub scenes: &'static [SampleScene],
}

pub struct SampleKnowledge {
    pub title: &'static str,
    pub body: &'static str,
    pub type_index: usize,
}

pub struct SampleWork {
    pub name: &'static str,
    pub outline: &'static [SampleChapter],
    pub trash_outline: &'static [SampleChapter],
    pub orphaned_scenes: &'static [(usize, SampleScene)],
    pub custom_knowledge_types: &'static [CustomKnowledgeType],
    pub knowledge: &'static [SampleKnowledge],
}

pub async fn seed_initial_data(pool: &DbPool, language: &Language) -> Result<()> {
    let all_works = match language {
        Language::En => vec![&super::sample_works_en::THE_HAPPY_PRINCE],
        Language::Ja => vec![&super::sample_works::GINGA_TETSUDO_NO_YORU],
    };
    let knowledge_types = default_knowledge_types(language);

    for work in all_works {
        let work_id = Uuid::new_v4().to_string();
        query("INSERT INTO works (id, name) VALUES (?1, ?2)")
            .bind(&work_id)
            .bind(work.name)
            .execute(pool)
            .await?;

        let mut chapter_ids = Vec::new();

        for (root_index, chapter) in work.outline.iter().enumerate() {
            let chapter_id = Uuid::new_v4().to_string();
            query("INSERT INTO chapters (id, work_id, title, sort_order) VALUES (?1, ?2, ?3, ?4)")
                .bind(&chapter_id)
                .bind(&work_id)
                .bind(chapter.title)
                .bind(root_index as i64)
                .execute(pool)
                .await?;

            chapter_ids.push(chapter_id.clone());

            for (scene_index, scene) in chapter.scenes.iter().enumerate() {
                let scene_id = Uuid::new_v4().to_string();
                let word_count = count_characters(scene.body);
                query("INSERT INTO scenes (id, chapter_id, title, synopsis, content_text, content_markups, sort_order, word_count) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)")
                    .bind(&scene_id)
                    .bind(&chapter_id)
                    .bind(scene.title)
                    .bind(scene.synopsis)
                    .bind(scene.body)
                    .bind("[]")
                    .bind(scene_index as i64)
                    .bind(word_count)
                    .execute(pool)
                    .await?;

                if root_index == 0 && scene_index == 0 {
                    seed_scene_versions(pool, &scene_id, scene.body, language).await?;
                }
            }
        }

        for (chapter_index, scene) in work.orphaned_scenes {
            if let Some(chapter_id) = chapter_ids.get(*chapter_index) {
                let scene_id = Uuid::new_v4().to_string();
                let word_count = count_characters(scene.body);
                let sort_order = 9999i64;
                query("INSERT INTO scenes (id, chapter_id, title, synopsis, content_text, content_markups, sort_order, word_count, is_deleted) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1)")
                    .bind(&scene_id)
                    .bind(chapter_id)
                    .bind(scene.title)
                    .bind(scene.synopsis)
                    .bind(scene.body)
                    .bind("[]")
                    .bind(sort_order)
                    .bind(word_count)
                    .execute(pool)
                    .await?;
            }
        }

        let trash_base_sort = work.outline.len() as i64;
        for (trash_offset, chapter) in work.trash_outline.iter().enumerate() {
            let chapter_sort_order = trash_base_sort + trash_offset as i64;
            let chapter_id = Uuid::new_v4().to_string();
            query(
                "INSERT INTO chapters (id, work_id, title, sort_order, is_deleted) VALUES (?1, ?2, ?3, ?4, 1)",
            )
            .bind(&chapter_id)
            .bind(&work_id)
            .bind(chapter.title)
            .bind(chapter_sort_order)
            .execute(pool)
            .await?;

            for (scene_index, scene) in chapter.scenes.iter().enumerate() {
                let scene_id = Uuid::new_v4().to_string();
                let word_count = count_characters(scene.body);
                query("INSERT INTO scenes (id, chapter_id, title, synopsis, content_text, content_markups, sort_order, word_count, is_deleted) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1)")
                    .bind(&scene_id)
                    .bind(&chapter_id)
                    .bind(scene.title)
                    .bind(scene.synopsis)
                    .bind(scene.body)
                    .bind("[]")
                    .bind(scene_index as i64)
                    .bind(word_count)
                    .execute(pool)
                    .await?;
            }
        }

        let mut type_ids = Vec::new();
        for (sort_order, default_type) in knowledge_types.iter().enumerate() {
            let type_id = Uuid::new_v4().to_string();
            query(
                "INSERT INTO knowledge_types (id, work_id, name, icon, sort_order) VALUES (?1, ?2, ?3, ?4, ?5)"
            )
            .bind(&type_id)
            .bind(&work_id)
            .bind(default_type.name)
            .bind(default_type.icon)
            .bind(sort_order as i64)
            .execute(pool)
            .await?;
            type_ids.push(type_id);
        }

        let custom_type_start = knowledge_types.len();
        for (offset, custom_type) in work.custom_knowledge_types.iter().enumerate() {
            let type_id = Uuid::new_v4().to_string();
            let sort_order = (custom_type_start + offset) as i64;
            query(
                "INSERT INTO knowledge_types (id, work_id, name, color, icon, sort_order) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
            )
            .bind(&type_id)
            .bind(&work_id)
            .bind(custom_type.name)
            .bind(custom_type.color)
            .bind(custom_type.icon)
            .bind(sort_order)
            .execute(pool)
            .await?;
            type_ids.push(type_id);
        }

        for (knowledge_index, knowledge) in work.knowledge.iter().enumerate() {
            let knowledge_id = Uuid::new_v4().to_string();
            let type_id = type_ids
                .get(knowledge.type_index)
                .ok_or_else(|| anyhow::anyhow!("Invalid type_index: {}", knowledge.type_index))?;
            let plain_text = strip_html_tags(knowledge.body);
            query("INSERT INTO knowledge (id, type_id, title, body, plain_text, sort_order) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
                .bind(&knowledge_id)
                .bind(type_id)
                .bind(knowledge.title)
                .bind(knowledge.body)
                .bind(&plain_text)
                .bind(knowledge_index as i64)
                .execute(pool)
                .await?;
        }
    }

    Ok(())
}

fn count_characters(text: &str) -> i64 {
    text.chars().filter(|c| !c.is_whitespace()).count() as i64
}

fn strip_html_tags(html: &str) -> String {
    RE_HTML_TAG.replace_all(html, "").to_string()
}

async fn seed_scene_versions(
    pool: &DbPool,
    scene_id: &str,
    _current_body: &str,
    language: &Language,
) -> Result<()> {
    let versions: Vec<(&str, &str, &str)> = match language {
        Language::Ja => seed_versions_ja(),
        Language::En => seed_versions_en(),
    };

    for (label, content, created_at) in versions {
        let version_id = Uuid::new_v4().to_string();
        query(
            "INSERT INTO scene_versions (id, scene_id, content_text, content_markups, label, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
        )
        .bind(&version_id)
        .bind(scene_id)
        .bind(content)
        .bind("[]")
        .bind(label)
        .bind(created_at)
        .execute(pool)
        .await?;
    }

    Ok(())
}

fn seed_versions_ja() -> Vec<(&'static str, &'static str, &'static str)> {
    vec![
        ("下書き", "先生が銀河について質問する。\nカムパネルラが手をあげる。ジョバンニも手をあげようとするが、やめる。\n先生がジョバンニを指名。答えられない。\nザネリが笑う。ジョバンニは赤くなる。\n\n※ここで授業の様子をもっと詳しく描写する\n※カムパネルラとジョバンニの関係性を示す伏線を入れる", "2025-01-08 23:15:00"),
        ("第一稿", "「ではみなさんは、そういうふうに川だと云われたり、乳の流れたあとだと云われたりしていたこのぼんやりと白いものがほんとうは何かご承知ですか。」先生は、黒板に吊した大きな星座の図を指しながら、みんなに問をかけました。\n　カムパネルラが手をあげました。四五人も手をあげました。ジョバンニも手をあげようとして、急いでやめました。", "2025-01-10 14:30:00"),
        ("推敲", "「ではみなさんは、そういうふうに川だと云われたり、乳の流れたあとだと云われたりしていたこのぼんやりと白いものがほんとうは何かご承知ですか。」先生は、黒板に吊した大きな黒い星座の図の、上から下へ白くけぶった銀河帯のようなところを指しながら、みんなに問をかけました。\n　カムパネルラが手をあげました。それから四五人手をあげました。ジョバンニも手をあげようとして、急いでそのままやめました。", "2025-01-15 09:15:00"),
        ("最終稿", "「ではみなさんは、そういうふうに川だと云われたり、乳の流れたあとだと云われたりしていたこのぼんやりと白いものがほんとうは何かご承知ですか。」先生は、黒板に吊した大きな黒い星座の図の、上から下へ白くけぶった銀河帯のようなところを指しながら、みんなに問をかけました。\n　カムパネルラが手をあげました。それから四五人手をあげました。ジョバンニも手をあげようとして、急いでそのままやめました。たしかにあれがみんな星だと、いつか雑誌で読んだのでしたが、このごろはジョバンニはまるで毎日教室でもねむく、本を読むひまも読む本もないので、なんだかどんなこともよくわからないという気持ちがするのでした。", "2025-01-20 16:45:00"),
    ]
}

fn seed_versions_en() -> Vec<(&'static str, &'static str, &'static str)> {
    vec![
        ("Outline", "The Swallow arrives in the city. Lands on the statue. Discovers the Prince is weeping.\nThe Prince tells of his former life in the Palace of Sans-Souci.\nNow he can see the misery of the city.\n\n* Need to establish the Swallow's character through the Reed episode\n* Foreshadow the theme of sacrifice", "2025-01-08 23:15:00"),
        ("First draft", "High above the city, on a tall column, stood the statue of the Happy Prince. He was gilded all over with thin leaves of fine gold, for eyes he had two bright sapphires, and a large red ruby glowed on his sword-hilt. He was very much admired indeed.\nOne night there flew over the city a little Swallow. His friends had gone away to Egypt six weeks before, but he had stayed behind. He alighted just between the feet of the Happy Prince.\nBut just as he was putting his head under his wing a large drop of water fell on him. The eyes of the Happy Prince were filled with tears.", "2025-01-10 14:30:00"),
        ("Revised", "High above the city, on a tall column, stood the statue of the Happy Prince. He was gilded all over with thin leaves of fine gold, for eyes he had two bright sapphires, and a large red ruby glowed on his sword-hilt.\nHe was very much admired indeed. \"He is as beautiful as a weathercock,\" remarked one of the Town Councillors.\nOne night there flew over the city a little Swallow. His friends had gone away to Egypt six weeks before, but he had stayed behind, for he was in love with the most beautiful Reed.\nThe eyes of the Happy Prince were filled with tears, and tears were running down his golden cheeks.", "2025-01-15 09:15:00"),
        ("Final", "HIGH above the city, on a tall column, stood the statue of the Happy Prince. He was gilded all over with thin leaves of fine gold, for eyes he had two bright sapphires, and a large red ruby glowed on his sword-hilt.\n\nHe was very much admired indeed. \"He is as beautiful as a weathercock,\" remarked one of the Town Councillors who wished to gain a reputation for having artistic tastes; \"only not quite so useful,\" he added, fearing lest people should think him unpractical, which he really was not.\n\n\"Why can't you be like the Happy Prince?\" asked a sensible mother of her little boy who was crying for the moon. \"The Happy Prince never dreams of crying for anything.\"", "2025-01-20 16:45:00"),
    ]
}
