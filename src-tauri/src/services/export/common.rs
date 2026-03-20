use std::sync::LazyLock;

use regex::Regex;

use crate::db::DbPool;
use crate::error::AppResult;
use crate::models::{ContentMarkup, RubyMode, Work};

static RE_FILENAME: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"[^\p{Letter}\p{Number}\s\-_]").unwrap());
static RE_WHITESPACE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\s+").unwrap());

const WHITESPACE_CHARS: &[char] = &[' ', '\u{3000}', '\t', '\u{00A0}'];

const DIALOGUE_START_CHARS: &[char] = &[
    '「', '『', '（', '(', '"', '\'', '\u{2018}', '\u{2019}', '\u{201C}', '\u{201D}', '【', '〈',
    '《',
];

const SPECIAL_START_CHARS: &[char] = &[
    '—', '―', '─', '–', '…', '⋯', '・', '●', '○', '■', '□', '◆', '◇', '▲', '△', '▼', '▽', '★', '☆',
    '※', '†', '‡', '＊', '*', '→', '←', '↑', '↓', '⇒', '⇐',
];

pub fn should_auto_indent(text: &str) -> bool {
    if text.is_empty() {
        return false;
    }

    let first_char = match text.chars().next() {
        Some(c) => c,
        None => return false,
    };

    if WHITESPACE_CHARS.contains(&first_char) {
        return false;
    }

    if DIALOGUE_START_CHARS.contains(&first_char) {
        return false;
    }

    if SPECIAL_START_CHARS.contains(&first_char) {
        return false;
    }

    true
}

#[derive(Debug, Clone, PartialEq)]
pub enum DocxSegment {
    Text(String),
    Ruby { base: String, ruby: String },
    EmphasisDot(String),
}

pub fn content_to_docx_segments(
    content_text: &str,
    content_markups: &str,
) -> Vec<Vec<DocxSegment>> {
    if content_text.is_empty() {
        return vec![];
    }

    let markups: Vec<ContentMarkup> = serde_json::from_str(content_markups).unwrap_or_default();

    let mut paragraphs = Vec::new();
    let mut char_offset = 0;

    for paragraph in content_text.split('\n') {
        let para_start = char_offset;
        let para_char_count = paragraph.chars().count();
        let para_end = para_start + para_char_count;

        if paragraph.is_empty() {
            paragraphs.push(vec![]);
            char_offset = para_end + 1;
            continue;
        }

        let para_markups: Vec<&ContentMarkup> = markups
            .iter()
            .filter(|m| {
                let (start, end) = match m {
                    ContentMarkup::Ruby { start, end, .. } => (*start, *end),
                    ContentMarkup::EmphasisDot { start, end } => (*start, *end),
                    ContentMarkup::Annotation { .. } => return false,
                };
                start >= para_start && end <= para_end
            })
            .collect();

        let segments = build_docx_paragraph_segments(paragraph, para_start, &para_markups);
        paragraphs.push(segments);

        char_offset = para_end + 1;
    }

    paragraphs
}

fn build_docx_paragraph_segments(
    paragraph: &str,
    para_offset: usize,
    markups: &[&ContentMarkup],
) -> Vec<DocxSegment> {
    let chars: Vec<char> = paragraph.chars().collect();
    let mut segments = Vec::new();
    let mut current_text = String::new();
    let mut i = 0;

    while i < chars.len() {
        let global_pos = para_offset + i;

        let mut found_markup = false;
        for markup in markups {
            match markup {
                ContentMarkup::Ruby { start, end, ruby } => {
                    if *start == global_pos {
                        let local_end = end - para_offset;
                        if local_end <= chars.len() {
                            if !current_text.is_empty() {
                                segments.push(DocxSegment::Text(std::mem::take(&mut current_text)));
                            }
                            let base_text: String = chars[i..local_end].iter().collect();
                            segments.push(DocxSegment::Ruby {
                                base: base_text,
                                ruby: ruby.clone(),
                            });
                            i = local_end;
                            found_markup = true;
                            break;
                        }
                    }
                }
                ContentMarkup::EmphasisDot { start, end } => {
                    if *start == global_pos {
                        let local_end = end - para_offset;
                        if local_end <= chars.len() {
                            if !current_text.is_empty() {
                                segments.push(DocxSegment::Text(std::mem::take(&mut current_text)));
                            }
                            let text: String = chars[i..local_end].iter().collect();
                            segments.push(DocxSegment::EmphasisDot(text));
                            i = local_end;
                            found_markup = true;
                            break;
                        }
                    }
                }
                ContentMarkup::Annotation { .. } => {}
            }
        }

        if !found_markup {
            current_text.push(chars[i]);
            i += 1;
        }
    }

    if !current_text.is_empty() {
        segments.push(DocxSegment::Text(current_text));
    }

    segments
}

pub fn content_to_html(content_text: &str, content_markups: &str, auto_indent: bool) -> String {
    if content_text.is_empty() {
        return String::new();
    }

    let markups: Vec<ContentMarkup> = serde_json::from_str(content_markups).unwrap_or_default();

    let mut result = String::new();
    let mut char_offset = 0;

    for paragraph in content_text.split('\n') {
        if paragraph.is_empty() {
            result.push_str("<p class=\"empty\"></p>\n");
            char_offset += 1;
            continue;
        }

        let para_start = char_offset;
        let para_char_count = paragraph.chars().count();
        let para_end = para_start + para_char_count;

        let para_markups: Vec<&ContentMarkup> = markups
            .iter()
            .filter(|m| {
                let (start, end) = match m {
                    ContentMarkup::Ruby { start, end, .. } => (*start, *end),
                    ContentMarkup::EmphasisDot { start, end } => (*start, *end),
                    ContentMarkup::Annotation { .. } => return false,
                };
                start >= para_start && end <= para_end
            })
            .collect();

        let paragraph_html = apply_markups_to_paragraph(paragraph, para_start, &para_markups);

        let indent = if auto_indent && should_auto_indent(paragraph) {
            "\u{3000}"
        } else {
            ""
        };
        result.push_str(&format!("<p>{}{}</p>\n", indent, paragraph_html));

        char_offset = para_end + 1;
    }

    result
}

fn apply_markups_to_paragraph(
    paragraph: &str,
    para_offset: usize,
    markups: &[&ContentMarkup],
) -> String {
    let chars: Vec<char> = paragraph.chars().collect();
    let mut result = String::new();
    let mut i = 0;

    while i < chars.len() {
        let global_pos = para_offset + i;

        let mut found_markup = false;
        for markup in markups {
            match markup {
                ContentMarkup::Ruby { start, end, ruby } => {
                    if *start == global_pos {
                        let local_end = end - para_offset;
                        if local_end <= chars.len() {
                            let base_text: String = chars[i..local_end].iter().collect();
                            result.push_str(&format!(
                                "<ruby><rb>{}</rb><rp>(</rp><rt>{}</rt><rp>)</rp></ruby>",
                                escape_html(&base_text),
                                escape_html(ruby)
                            ));
                            i = local_end;
                            found_markup = true;
                            break;
                        }
                    }
                }
                ContentMarkup::EmphasisDot { start, end } => {
                    if *start == global_pos {
                        let local_end = end - para_offset;
                        if local_end <= chars.len() {
                            let text: String = chars[i..local_end].iter().collect();
                            result.push_str(&format!(
                                "<span class=\"emphasis\">{}</span>",
                                escape_html(&text)
                            ));
                            i = local_end;
                            found_markup = true;
                            break;
                        }
                    }
                }
                ContentMarkup::Annotation { .. } => {}
            }
        }

        if !found_markup {
            result.push_str(&escape_html(&chars[i].to_string()));
            i += 1;
        }
    }

    result
}

pub fn escape_html(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#x27;")
}

#[derive(Debug, sqlx::FromRow)]
pub struct ExportChapter {
    pub id: String,
    pub title: String,
    pub sort_order: i64,
}

#[derive(Debug, sqlx::FromRow)]
pub struct ExportScene {
    pub chapter_id: String,
    pub title: String,
    pub content_text: String,
    pub content_markups: String,
}

pub struct ExportData {
    pub work: Work,
    pub chapters: Vec<ExportChapter>,
    pub scenes: Vec<ExportScene>,
}

pub async fn get_export_data(
    pool: &DbPool,
    work_id: &str,
    chapter_ids: Option<&Vec<String>>,
    scene_ids: Option<&Vec<String>>,
) -> AppResult<ExportData> {
    let work = sqlx::query_as::<_, Work>(
        "SELECT id, name, created_at, updated_at FROM works WHERE id = ?",
    )
    .bind(work_id)
    .fetch_one(pool)
    .await?;

    let chapters: Vec<ExportChapter> = if let Some(ids) = chapter_ids {
        if ids.is_empty() {
            sqlx::query_as::<_, ExportChapter>(
                "SELECT id, title, sort_order FROM chapters WHERE work_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC",
            )
            .bind(work_id)
            .fetch_all(pool)
            .await?
        } else {
            let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
            let query = format!(
                "SELECT id, title, sort_order FROM chapters WHERE id IN ({}) AND is_deleted = 0 ORDER BY sort_order ASC, id ASC",
                placeholders
            );
            let mut q = sqlx::query_as::<_, ExportChapter>(&query);
            for id in ids {
                q = q.bind(id);
            }
            q.fetch_all(pool).await?
        }
    } else {
        sqlx::query_as::<_, ExportChapter>(
            "SELECT id, title, sort_order FROM chapters WHERE work_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC",
        )
        .bind(work_id)
        .fetch_all(pool)
        .await?
    };

    let scenes: Vec<ExportScene> = if let Some(ids) = scene_ids {
        if ids.is_empty() {
            vec![]
        } else {
            let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
            let query = format!(
                "SELECT s.chapter_id, s.title, s.content_text, s.content_markups
                 FROM scenes s
                 JOIN chapters c ON s.chapter_id = c.id
                 WHERE s.id IN ({}) AND s.is_deleted = 0
                 ORDER BY c.sort_order ASC, s.sort_order ASC, s.id ASC",
                placeholders
            );
            let mut q = sqlx::query_as::<_, ExportScene>(&query);
            for id in ids {
                q = q.bind(id);
            }
            q.fetch_all(pool).await?
        }
    } else {
        let chapter_id_list: Vec<String> = chapters.iter().map(|c| c.id.clone()).collect();
        if chapter_id_list.is_empty() {
            vec![]
        } else {
            let placeholders = chapter_id_list
                .iter()
                .map(|_| "?")
                .collect::<Vec<_>>()
                .join(",");
            let query = format!(
                "SELECT s.chapter_id, s.title, s.content_text, s.content_markups
                 FROM scenes s
                 JOIN chapters c ON s.chapter_id = c.id
                 WHERE s.chapter_id IN ({}) AND s.is_deleted = 0
                 ORDER BY c.sort_order ASC, s.sort_order ASC, s.id ASC",
                placeholders
            );
            let mut q = sqlx::query_as::<_, ExportScene>(&query);
            for id in &chapter_id_list {
                q = q.bind(id);
            }
            q.fetch_all(pool).await?
        }
    };

    Ok(ExportData {
        work,
        chapters,
        scenes,
    })
}

pub fn sanitize_filename(name: &str) -> String {
    let sanitized = RE_FILENAME.replace_all(name, "_");
    RE_WHITESPACE
        .replace_all(&sanitized, " ")
        .trim()
        .to_string()
}

pub fn content_to_txt(content_text: &str, content_markups: &str, ruby_mode: &RubyMode) -> String {
    if content_text.is_empty() {
        return String::new();
    }

    let markups: Vec<ContentMarkup> = serde_json::from_str(content_markups).unwrap_or_default();

    let markups: Vec<ContentMarkup> = markups
        .into_iter()
        .filter(|m| !matches!(m, ContentMarkup::Annotation { .. }))
        .collect();

    let mut sorted_markups = markups.clone();
    sorted_markups.sort_by(|a, b| {
        let a_start = match a {
            ContentMarkup::Ruby { start, .. } => *start,
            ContentMarkup::EmphasisDot { start, .. } => *start,
            ContentMarkup::Annotation { start, .. } => *start,
        };
        let b_start = match b {
            ContentMarkup::Ruby { start, .. } => *start,
            ContentMarkup::EmphasisDot { start, .. } => *start,
            ContentMarkup::Annotation { start, .. } => *start,
        };
        b_start.cmp(&a_start)
    });

    let chars: Vec<char> = content_text.chars().collect();
    let mut result_chars = chars.clone();

    for markup in sorted_markups {
        match markup {
            ContentMarkup::Ruby { start, end, ruby } => {
                if start < result_chars.len() && end <= result_chars.len() && start < end {
                    let base_text: String = result_chars[start..end].iter().collect();
                    let replacement = match ruby_mode {
                        RubyMode::Angle => format!("|{}《{}》", base_text, ruby),
                        RubyMode::Paren => format!("{}({})", base_text, ruby),
                        RubyMode::None => base_text,
                    };
                    let replacement_chars: Vec<char> = replacement.chars().collect();
                    result_chars.splice(start..end, replacement_chars);
                }
            }
            ContentMarkup::EmphasisDot { start, end } => {
                if start < result_chars.len() && end <= result_chars.len() && start < end {
                    let text: String = result_chars[start..end].iter().collect();
                    let replacement = match ruby_mode {
                        RubyMode::Angle => format!("《《{}》》", text),
                        RubyMode::Paren => text.chars().map(|c| format!("|{}《・》", c)).collect(),
                        RubyMode::None => text,
                    };
                    let replacement_chars: Vec<char> = replacement.chars().collect();
                    result_chars.splice(start..end, replacement_chars);
                }
            }
            ContentMarkup::Annotation { .. } => {}
        }
    }

    result_chars.into_iter().collect()
}

pub fn post_process_text(text: &str, collapse_blank_lines: bool, auto_indent: bool) -> String {
    let mut lines: Vec<String> = text
        .lines()
        .map(|line| line.trim_end().to_string())
        .collect();

    if auto_indent {
        lines = lines
            .into_iter()
            .map(|line| {
                if should_auto_indent(&line) {
                    format!("　{}", line)
                } else {
                    line
                }
            })
            .collect();
    }

    if collapse_blank_lines {
        let mut result = Vec::new();
        let mut blank_count = 0;

        for line in lines {
            if line.is_empty() {
                blank_count += 1;
                if blank_count <= 2 {
                    result.push(line);
                }
            } else {
                blank_count = 0;
                result.push(line);
            }
        }
        lines = result;
    }

    while lines.last().is_some_and(|l| l.is_empty()) {
        lines.pop();
    }

    while lines.first().is_some_and(|l| l.is_empty()) {
        lines.remove(0);
    }

    let mut output = lines.join("\n");
    output.push('\n');

    output
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_should_auto_indent_normal_text() {
        assert!(should_auto_indent("これは地の文です。"));
        assert!(should_auto_indent("漢字で始まる文。"));
        assert!(should_auto_indent("1984年のことだった。"));
    }

    #[test]
    fn test_should_auto_indent_whitespace_start() {
        assert!(!should_auto_indent("　手動で字下げ済み"));
        assert!(!should_auto_indent(" 半角スペース"));
        assert!(!should_auto_indent("\tタブ"));
        assert!(!should_auto_indent("\u{00A0}ノーブレークスペース"));
    }

    #[test]
    fn test_should_auto_indent_dialogue_start() {
        assert!(!should_auto_indent("「こんにちは」"));
        assert!(!should_auto_indent("『引用文』"));
        assert!(!should_auto_indent("（補足説明）"));
        assert!(!should_auto_indent("(parentheses)"));
        assert!(!should_auto_indent("\"Hello\""));
        assert!(!should_auto_indent("【注意】"));
    }

    #[test]
    fn test_should_auto_indent_special_chars() {
        assert!(!should_auto_indent("——沈黙が続いた"));
        assert!(!should_auto_indent("―そして"));
        assert!(!should_auto_indent("…言葉が出なかった"));
        assert!(!should_auto_indent("・箇条書き項目"));
        assert!(!should_auto_indent("●重要なポイント"));
        assert!(!should_auto_indent("※注釈"));
        assert!(!should_auto_indent("→次のページへ"));
    }

    #[test]
    fn test_should_auto_indent_empty() {
        assert!(!should_auto_indent(""));
    }

    #[test]
    fn test_post_process_text_removes_leading_blank_lines() {
        let input = "\n\n\n本文です。\n";
        let result = post_process_text(input, false, false);
        assert_eq!(result, "本文です。\n");
    }

    #[test]
    fn test_post_process_text_removes_trailing_blank_lines() {
        let input = "本文です。\n\n\n\n";
        let result = post_process_text(input, false, false);
        assert_eq!(result, "本文です。\n");
    }

    #[test]
    fn test_post_process_text_preserves_internal_blank_lines() {
        let input = "段落1\n\n段落2\n";
        let result = post_process_text(input, false, false);
        assert_eq!(result, "段落1\n\n段落2\n");
    }

    #[test]
    fn test_post_process_text_collapses_excessive_blank_lines() {
        let input = "段落1\n\n\n\n\n段落2\n";
        let result = post_process_text(input, true, false);
        assert_eq!(result, "段落1\n\n\n段落2\n");
    }

    #[test]
    fn test_post_process_text_trims_trailing_whitespace() {
        let input = "本文です。   \n次の行。  \n";
        let result = post_process_text(input, false, false);
        assert_eq!(result, "本文です。\n次の行。\n");
    }

    #[test]
    fn test_post_process_text_auto_indent_normal() {
        let input = "これは地の文です。\n次の段落。\n";
        let result = post_process_text(input, false, true);
        assert_eq!(result, "　これは地の文です。\n　次の段落。\n");
    }

    #[test]
    fn test_post_process_text_auto_indent_dialogue() {
        let input = "「こんにちは」\n彼は言った。\n";
        let result = post_process_text(input, false, true);
        assert_eq!(result, "「こんにちは」\n　彼は言った。\n");
    }

    #[test]
    fn test_post_process_text_auto_indent_already_indented() {
        let input = "　手動で字下げ済み\n自動字下げ対象\n";
        let result = post_process_text(input, false, true);
        assert_eq!(result, "　手動で字下げ済み\n　自動字下げ対象\n");
    }

    #[test]
    fn test_post_process_text_auto_indent_special_chars() {
        let input = "…沈黙が続いた。\n彼は考えた。\n";
        let result = post_process_text(input, false, true);
        assert_eq!(result, "…沈黙が続いた。\n　彼は考えた。\n");
    }

    #[test]
    fn test_post_process_text_auto_indent_mixed() {
        let input = "地の文。\n「会話」\n　手動字下げ。\n※注釈\n続きの文。\n";
        let result = post_process_text(input, false, true);
        assert_eq!(
            result,
            "　地の文。\n「会話」\n　手動字下げ。\n※注釈\n　続きの文。\n"
        );
    }

    #[test]
    fn test_post_process_text_auto_indent_disabled() {
        let input = "地の文です。\n";
        let result = post_process_text(input, false, false);
        assert_eq!(result, "地の文です。\n");
    }

    #[test]
    fn test_sanitize_filename_removes_special_chars() {
        let result = sanitize_filename("作品名/テスト:2024");
        assert!(!result.contains('/'));
        assert!(!result.contains(':'));
    }

    #[test]
    fn test_sanitize_filename_preserves_japanese() {
        let result = sanitize_filename("私の小説");
        assert_eq!(result, "私の小説");
    }

    #[test]
    fn test_sanitize_filename_collapses_whitespace() {
        let result = sanitize_filename("作品   名前");
        assert_eq!(result, "作品 名前");
    }

    #[test]
    fn test_content_to_txt_basic() {
        let text = "これはテストです。";
        let markups = "[]";
        let result = content_to_txt(text, markups, &RubyMode::None);
        assert_eq!(result, "これはテストです。");
    }

    #[test]
    fn test_content_to_txt_ruby_angle() {
        let text = "漢字のテスト";
        let markups = r#"[{"type":"ruby","start":0,"end":2,"ruby":"かんじ"}]"#;
        let result = content_to_txt(text, markups, &RubyMode::Angle);
        assert_eq!(result, "|漢字《かんじ》のテスト");
    }

    #[test]
    fn test_content_to_txt_ruby_paren() {
        let text = "漢字のテスト";
        let markups = r#"[{"type":"ruby","start":0,"end":2,"ruby":"かんじ"}]"#;
        let result = content_to_txt(text, markups, &RubyMode::Paren);
        assert_eq!(result, "漢字(かんじ)のテスト");
    }

    #[test]
    fn test_content_to_txt_ruby_none() {
        let text = "漢字のテスト";
        let markups = r#"[{"type":"ruby","start":0,"end":2,"ruby":"かんじ"}]"#;
        let result = content_to_txt(text, markups, &RubyMode::None);
        assert_eq!(result, "漢字のテスト");
    }

    #[test]
    fn test_content_to_txt_emphasis_angle() {
        let text = "強調テスト";
        let markups = r#"[{"type":"emphasis_dot","start":0,"end":2}]"#;
        let result = content_to_txt(text, markups, &RubyMode::Angle);
        assert_eq!(result, "《《強調》》テスト");
    }

    #[test]
    fn test_content_to_txt_emphasis_paren() {
        let text = "テスト";
        let markups = r#"[{"type":"emphasis_dot","start":0,"end":3}]"#;
        let result = content_to_txt(text, markups, &RubyMode::Paren);
        assert_eq!(result, "|テ《・》|ス《・》|ト《・》");
    }

    #[test]
    fn test_content_to_txt_multiple_markups() {
        let text = "漢字と強調のテスト";
        let markups = r#"[
            {"type":"ruby","start":0,"end":2,"ruby":"かんじ"},
            {"type":"emphasis_dot","start":3,"end":5}
        ]"#;
        let result = content_to_txt(text, markups, &RubyMode::Angle);
        assert_eq!(result, "|漢字《かんじ》と《《強調》》のテスト");
    }

    #[test]
    fn test_docx_segments_plain_text() {
        let text = "これはテストです。";
        let markups = "[]";
        let result = content_to_docx_segments(text, markups);
        assert_eq!(
            result,
            vec![vec![DocxSegment::Text("これはテストです。".to_string())]]
        );
    }

    #[test]
    fn test_docx_segments_empty() {
        let result = content_to_docx_segments("", "[]");
        assert!(result.is_empty());
    }

    #[test]
    fn test_docx_segments_ruby() {
        let text = "漢字のテスト";
        let markups = r#"[{"type":"ruby","start":0,"end":2,"ruby":"かんじ"}]"#;
        let result = content_to_docx_segments(text, markups);
        assert_eq!(
            result,
            vec![vec![
                DocxSegment::Ruby {
                    base: "漢字".to_string(),
                    ruby: "かんじ".to_string(),
                },
                DocxSegment::Text("のテスト".to_string()),
            ]]
        );
    }

    #[test]
    fn test_docx_segments_multiple_ruby() {
        let text = "漢字と強調";
        let markups = r#"[
            {"type":"ruby","start":0,"end":2,"ruby":"かんじ"},
            {"type":"ruby","start":3,"end":5,"ruby":"きょうちょう"}
        ]"#;
        let result = content_to_docx_segments(text, markups);
        assert_eq!(
            result,
            vec![vec![
                DocxSegment::Ruby {
                    base: "漢字".to_string(),
                    ruby: "かんじ".to_string(),
                },
                DocxSegment::Text("と".to_string()),
                DocxSegment::Ruby {
                    base: "強調".to_string(),
                    ruby: "きょうちょう".to_string(),
                },
            ]]
        );
    }

    #[test]
    fn test_docx_segments_emphasis_dot() {
        let text = "強調テスト";
        let markups = r#"[{"type":"emphasis_dot","start":0,"end":2}]"#;
        let result = content_to_docx_segments(text, markups);
        assert_eq!(
            result,
            vec![vec![
                DocxSegment::EmphasisDot("強調".to_string()),
                DocxSegment::Text("テスト".to_string()),
            ]]
        );
    }

    #[test]
    fn test_docx_segments_multiline() {
        let text = "一行目\n二行目";
        let markups = "[]";
        let result = content_to_docx_segments(text, markups);
        assert_eq!(
            result,
            vec![
                vec![DocxSegment::Text("一行目".to_string())],
                vec![DocxSegment::Text("二行目".to_string())],
            ]
        );
    }

    #[test]
    fn test_docx_segments_multiline_with_ruby() {
        let text = "漢字\nテスト";
        let markups = r#"[{"type":"ruby","start":0,"end":2,"ruby":"かんじ"}]"#;
        let result = content_to_docx_segments(text, markups);
        assert_eq!(
            result,
            vec![
                vec![DocxSegment::Ruby {
                    base: "漢字".to_string(),
                    ruby: "かんじ".to_string(),
                }],
                vec![DocxSegment::Text("テスト".to_string())],
            ]
        );
    }

    #[test]
    fn test_docx_segments_empty_line() {
        let text = "一行目\n\n三行目";
        let markups = "[]";
        let result = content_to_docx_segments(text, markups);
        assert_eq!(
            result,
            vec![
                vec![DocxSegment::Text("一行目".to_string())],
                vec![],
                vec![DocxSegment::Text("三行目".to_string())],
            ]
        );
    }

    #[test]
    fn test_docx_segments_annotation_filtered() {
        let text = "テスト文章";
        let markups = r#"[{"type":"annotation","start":0,"end":3,"id":"a1","comment":"コメント"}]"#;
        let result = content_to_docx_segments(text, markups);
        assert_eq!(
            result,
            vec![vec![DocxSegment::Text("テスト文章".to_string())]]
        );
    }
}
