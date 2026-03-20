use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::{ProjectSearchResult, ReplaceResult, SearchMatch};
use crate::repositories::scene as scene_repo;
use regex::{Regex, RegexBuilder};
use sqlx::FromRow;

#[derive(Debug, FromRow)]
struct SceneForSearch {
    id: String,
    title: String,
    content_text: String,
    chapter_id: String,
    chapter_title: String,
}

pub async fn search_project(
    pool: &DbPool,
    work_id: &str,
    query: &str,
    case_sensitive: bool,
) -> AppResult<ProjectSearchResult> {
    if query.is_empty() {
        return Ok(ProjectSearchResult {
            total_matches: 0,
            total_scenes: 0,
            matches: vec![],
        });
    }

    let scenes = sqlx::query_as::<_, SceneForSearch>(
        r#"
        SELECT
            s.id,
            s.title,
            s.content_text,
            c.id as chapter_id,
            c.title as chapter_title
        FROM scenes s
        INNER JOIN chapters c ON s.chapter_id = c.id
        WHERE c.work_id = ?
          AND s.is_deleted = 0
          AND c.is_deleted = 0
        ORDER BY c.sort_order ASC, s.sort_order ASC
        "#,
    )
    .bind(work_id)
    .fetch_all(pool)
    .await?;

    let escaped_query = regex::escape(query);
    let regex = RegexBuilder::new(&escaped_query)
        .case_insensitive(!case_sensitive)
        .build()
        .map_err(|e| crate::error::AppError::Internal(format!("Invalid search pattern: {}", e)))?;

    let mut all_matches = Vec::new();
    let mut matched_scene_ids = std::collections::HashSet::new();

    for scene in &scenes {
        let scene_matches = find_matches_in_text(
            &scene.content_text,
            &regex,
            &scene.id,
            &scene.title,
            &scene.chapter_id,
            &scene.chapter_title,
        );

        if !scene_matches.is_empty() {
            matched_scene_ids.insert(scene.id.clone());
            all_matches.extend(scene_matches);
        }
    }

    Ok(ProjectSearchResult {
        total_matches: all_matches.len() as i32,
        total_scenes: matched_scene_ids.len() as i32,
        matches: all_matches,
    })
}

fn find_matches_in_text(
    text: &str,
    regex: &Regex,
    scene_id: &str,
    scene_title: &str,
    chapter_id: &str,
    chapter_title: &str,
) -> Vec<SearchMatch> {
    let mut matches = Vec::new();
    let lines: Vec<&str> = text.lines().collect();

    let mut char_offset = 0;

    for (line_idx, line) in lines.iter().enumerate() {
        for mat in regex.find_iter(line) {
            let match_start_chars = line[..mat.start()].chars().count();
            let match_end_chars = line[..mat.end()].chars().count();
            let char_offset_in_line = line[..mat.start()].chars().count();

            matches.push(SearchMatch {
                scene_id: scene_id.to_string(),
                scene_title: scene_title.to_string(),
                chapter_id: chapter_id.to_string(),
                chapter_title: chapter_title.to_string(),
                line_number: (line_idx + 1) as i32,
                line_text: line.to_string(),
                match_start: match_start_chars as i32,
                match_end: match_end_chars as i32,
                char_offset: (char_offset + char_offset_in_line) as i32,
            });
        }

        char_offset += line.chars().count() + 1;
    }

    matches
}

#[derive(Debug, FromRow)]
struct SceneForReplace {
    id: String,
    content_text: String,
    content_markups: String,
}

pub async fn replace_in_project(
    pool: &DbPool,
    work_id: &str,
    search: &str,
    replace: &str,
    case_sensitive: bool,
    scene_ids: Option<Vec<String>>,
) -> AppResult<ReplaceResult> {
    if search.is_empty() {
        return Ok(ReplaceResult {
            replaced_count: 0,
            affected_scenes: 0,
        });
    }

    let escaped_search = regex::escape(search);
    let regex = RegexBuilder::new(&escaped_search)
        .case_insensitive(!case_sensitive)
        .build()
        .map_err(|e| crate::error::AppError::Internal(format!("Invalid search pattern: {}", e)))?;

    let scenes = if let Some(ref ids) = scene_ids {
        if ids.is_empty() {
            return Ok(ReplaceResult {
                replaced_count: 0,
                affected_scenes: 0,
            });
        }

        let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let query = format!(
            r#"
            SELECT
                s.id,
                s.content_text,
                s.content_markups
            FROM scenes s
            INNER JOIN chapters c ON s.chapter_id = c.id
            WHERE c.work_id = ?
              AND s.is_deleted = 0
              AND c.is_deleted = 0
              AND s.id IN ({})
            "#,
            placeholders
        );

        let mut query_builder = sqlx::query_as::<_, SceneForReplace>(&query).bind(work_id);
        for id in ids {
            query_builder = query_builder.bind(id);
        }
        query_builder.fetch_all(pool).await?
    } else {
        sqlx::query_as::<_, SceneForReplace>(
            r#"
            SELECT
                s.id,
                s.content_text,
                s.content_markups
            FROM scenes s
            INNER JOIN chapters c ON s.chapter_id = c.id
            WHERE c.work_id = ?
              AND s.is_deleted = 0
              AND c.is_deleted = 0
            "#,
        )
        .bind(work_id)
        .fetch_all(pool)
        .await?
    };

    let mut total_replaced = 0;
    let mut affected_scenes = 0;

    let mut tx = pool.begin().await?;

    for scene in scenes {
        let match_count = regex.find_iter(&scene.content_text).count();

        if match_count == 0 {
            continue;
        }

        let new_content_text = regex.replace_all(&scene.content_text, replace).to_string();

        let new_markups = adjust_markups_after_replace(
            &scene.content_text,
            &new_content_text,
            &scene.content_markups,
            &regex,
            replace,
        )?;

        let new_word_count = new_content_text
            .chars()
            .filter(|c| !c.is_whitespace())
            .count() as i64;

        scene_repo::update_content(&mut *tx, &scene.id, &new_content_text, &new_markups).await?;

        scene_repo::update_word_count_field(&mut *tx, &scene.id, new_word_count).await?;

        total_replaced += match_count;
        affected_scenes += 1;
    }

    tx.commit().await?;

    Ok(ReplaceResult {
        replaced_count: total_replaced as i32,
        affected_scenes,
    })
}

fn adjust_markups_after_replace(
    old_text: &str,
    new_text: &str,
    markups_json: &str,
    regex: &Regex,
    replace: &str,
) -> AppResult<String> {
    use crate::models::ContentMarkup;

    if markups_json == "[]" {
        return Ok("[]".to_string());
    }

    let markups: Vec<ContentMarkup> = serde_json::from_str(markups_json)
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to parse markups: {}", e)))?;

    if markups.is_empty() {
        return Ok("[]".to_string());
    }

    let mut adjustments: Vec<(usize, usize, i64)> = Vec::new();
    let replace_len = replace.chars().count() as i64;

    for mat in regex.find_iter(old_text) {
        let start_chars = old_text[..mat.start()].chars().count();
        let match_len = old_text[mat.start()..mat.end()].chars().count();
        let end_chars = start_chars + match_len;
        let delta = replace_len - match_len as i64;
        adjustments.push((start_chars, end_chars, delta));
    }

    let adjusted_markups: Vec<ContentMarkup> = markups
        .into_iter()
        .filter_map(|markup| {
            let (start, end) = match &markup {
                ContentMarkup::Ruby { start, end, .. } => (*start, *end),
                ContentMarkup::EmphasisDot { start, end } => (*start, *end),
                ContentMarkup::Annotation { start, end, .. } => (*start, *end),
            };

            let mut start_adj: i64 = 0;
            let mut end_adj: i64 = 0;

            for (adj_start, adj_end, delta) in &adjustments {
                if *adj_end <= start {
                    start_adj += delta;
                    end_adj += delta;
                } else if *adj_start >= end {
                } else {
                    return None;
                }
            }

            let new_start = (start as i64 + start_adj).max(0) as usize;
            let new_end = (end as i64 + end_adj).max(0) as usize;

            if new_start >= new_end || new_end > new_text.chars().count() {
                return None;
            }

            Some(match markup {
                ContentMarkup::Ruby { ruby, .. } => ContentMarkup::Ruby {
                    start: new_start,
                    end: new_end,
                    ruby,
                },
                ContentMarkup::EmphasisDot { .. } => ContentMarkup::EmphasisDot {
                    start: new_start,
                    end: new_end,
                },
                ContentMarkup::Annotation { id, comment, .. } => ContentMarkup::Annotation {
                    start: new_start,
                    end: new_end,
                    id,
                    comment,
                },
            })
        })
        .collect();

    serde_json::to_string(&adjusted_markups).map_err(|e| {
        crate::error::AppError::Internal(format!("Failed to serialize markups: {}", e))
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_find_matches_in_text() {
        let text = "Hello world\nHello again\nGoodbye";
        let regex = RegexBuilder::new("hello")
            .case_insensitive(true)
            .build()
            .unwrap();

        let matches = find_matches_in_text(text, &regex, "1", "Test Scene", "1", "Test Chapter");

        assert_eq!(matches.len(), 2);
        assert_eq!(matches[0].line_number, 1);
        assert_eq!(matches[0].match_start, 0);
        assert_eq!(matches[0].match_end, 5);
        assert_eq!(matches[0].char_offset, 0);

        assert_eq!(matches[1].line_number, 2);
        assert_eq!(matches[1].match_start, 0);
        assert_eq!(matches[1].match_end, 5);
        assert_eq!(matches[1].char_offset, 12);
    }

    #[test]
    fn test_find_matches_case_sensitive() {
        let text = "Hello world\nhello again";
        let regex = RegexBuilder::new("Hello")
            .case_insensitive(false)
            .build()
            .unwrap();

        let matches = find_matches_in_text(text, &regex, "1", "Test", "1", "Chapter");

        assert_eq!(matches.len(), 1);
        assert_eq!(matches[0].line_number, 1);
    }

    #[test]
    fn test_find_matches_with_japanese_text() {
        let text = "こんにちは世界です";
        let regex = RegexBuilder::new("世界")
            .case_insensitive(false)
            .build()
            .unwrap();

        let matches = find_matches_in_text(text, &regex, "1", "Test", "1", "Chapter");

        assert_eq!(matches.len(), 1);
        assert_eq!(matches[0].match_start, 5);
        assert_eq!(matches[0].match_end, 7);
        assert_eq!(matches[0].char_offset, 5);
    }

    #[test]
    fn test_find_matches_mixed_text() {
        let text = "Hello こんにちは world 世界";
        let regex = RegexBuilder::new("世界")
            .case_insensitive(false)
            .build()
            .unwrap();

        let matches = find_matches_in_text(text, &regex, "1", "Test", "1", "Chapter");

        assert_eq!(matches.len(), 1);
        assert_eq!(matches[0].match_start, 18);
        assert_eq!(matches[0].match_end, 20);
    }

    #[test]
    fn test_adjust_markups_empty() {
        let regex = RegexBuilder::new("test").build().unwrap();
        let result = adjust_markups_after_replace("hello", "hello", "[]", &regex, "x").unwrap();
        assert_eq!(result, "[]");
    }

    #[test]
    fn test_adjust_markups_no_overlap() {
        let regex = RegexBuilder::new("world").build().unwrap();
        let old_text = "hello world";
        let new_text = "hello universe";
        let markups = r#"[{"type":"ruby","start":0,"end":5,"ruby":"ハロー"}]"#;

        let result =
            adjust_markups_after_replace(old_text, new_text, markups, &regex, "universe").unwrap();

        let parsed: Vec<serde_json::Value> = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed.len(), 1);
        assert_eq!(parsed[0]["start"], 0);
        assert_eq!(parsed[0]["end"], 5);
    }
}
