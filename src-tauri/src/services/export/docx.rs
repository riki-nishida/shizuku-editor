use docx_rs::{
    AlignmentType, Docx, Paragraph, Run, RunFonts, SectionProperty, Style, StyleType,
    TextDirectionType,
};
use std::fs::File;
use std::io::BufWriter;
use std::io::Write;
use std::path::PathBuf;

use super::common::{
    content_to_docx_segments, get_export_data, should_auto_indent, DocxSegment, ExportData,
    ExportScene,
};
use crate::db::DbPool;
use crate::error::{AppError, AppResult};
use crate::models::{DocxExportPayload, ExportResult, WritingMode};

enum DocxPlaceholder {
    Ruby {
        id: String,
        base: String,
        ruby: String,
    },
    EmphasisDot {
        id: String,
        text: String,
    },
}

pub async fn export_docx(pool: &DbPool, payload: DocxExportPayload) -> AppResult<ExportResult> {
    let data = get_export_data(
        pool,
        &payload.work_id,
        payload.chapter_ids.as_ref(),
        payload.scene_ids.as_ref(),
    )
    .await?;

    let filepath = PathBuf::from(&payload.export_path);

    let (docx, placeholders) = build_docx(&data, &payload);

    let mut xml_docx = docx.build();
    if !placeholders.is_empty() {
        xml_docx.document = replace_placeholders(xml_docx.document, &placeholders)?;
    }

    let file = File::create(&filepath)?;
    let mut writer = BufWriter::new(file);
    xml_docx
        .pack(&mut writer)
        .map_err(|e| AppError::Internal(format!("Failed to create DOCX: {}", e)))?;
    writer.flush()?;

    Ok(ExportResult {
        saved_paths: vec![filepath.to_string_lossy().to_string()],
    })
}

fn build_docx(data: &ExportData, payload: &DocxExportPayload) -> (Docx, Vec<DocxPlaceholder>) {
    let mut docx = Docx::new();
    let mut placeholders: Vec<DocxPlaceholder> = Vec::new();
    let mut placeholder_counter: u32 = 0;

    let is_vertical = matches!(payload.writing_mode, WritingMode::Vertical);
    if is_vertical {
        let section = SectionProperty::new().text_direction(TextDirectionType::TbRl.to_string());
        docx = docx.document(docx_rs::Document::new().default_section_property(section));
    }

    docx = docx
        .add_style(
            Style::new("Heading1", StyleType::Paragraph)
                .name("Heading 1")
                .size(32 * 2)
                .bold(),
        )
        .add_style(
            Style::new("Heading2", StyleType::Paragraph)
                .name("Heading 2")
                .size(24 * 2)
                .bold(),
        )
        .add_style(
            Style::new("Normal", StyleType::Paragraph)
                .name("Normal")
                .size(12 * 2),
        );

    docx = docx.add_paragraph(
        Paragraph::new()
            .add_run(
                Run::new()
                    .add_text(&data.work.name)
                    .size(36 * 2)
                    .bold()
                    .fonts(RunFonts::new().east_asia("游明朝")),
            )
            .align(AlignmentType::Center),
    );

    docx = docx.add_paragraph(Paragraph::new());

    for chapter in &data.chapters {
        let chapter_scenes: Vec<&ExportScene> = data
            .scenes
            .iter()
            .filter(|s| s.chapter_id == chapter.id)
            .collect();

        if chapter_scenes.is_empty() {
            continue;
        }

        if payload.include_chapter_titles {
            docx = docx.add_paragraph(
                Paragraph::new()
                    .add_run(
                        Run::new()
                            .add_text(&chapter.title)
                            .size(24 * 2)
                            .bold()
                            .fonts(RunFonts::new().east_asia("游明朝")),
                    )
                    .style("Heading1"),
            );
            docx = docx.add_paragraph(Paragraph::new());
        }

        for scene in &chapter_scenes {
            if payload.include_scene_titles {
                docx = docx.add_paragraph(
                    Paragraph::new()
                        .add_run(
                            Run::new()
                                .add_text(&scene.title)
                                .size(18 * 2)
                                .bold()
                                .fonts(RunFonts::new().east_asia("游明朝")),
                        )
                        .style("Heading2"),
                );
            }

            let paragraphs = content_to_docx_segments(&scene.content_text, &scene.content_markups);

            for segments in &paragraphs {
                if segments.is_empty() {
                    docx = docx.add_paragraph(Paragraph::new());
                } else {
                    let mut paragraph = Paragraph::new();

                    let first_text = segments.first().map(|s| match s {
                        DocxSegment::Text(t) | DocxSegment::EmphasisDot(t) => t.as_str(),
                        DocxSegment::Ruby { base, .. } => base.as_str(),
                    });
                    let needs_indent =
                        payload.auto_indent && first_text.is_some_and(should_auto_indent);

                    if needs_indent {
                        paragraph = paragraph.add_run(
                            Run::new()
                                .add_text("　")
                                .size(12 * 2)
                                .fonts(RunFonts::new().east_asia("游明朝")),
                        );
                    }

                    for segment in segments {
                        match segment {
                            DocxSegment::Text(text) => {
                                paragraph = paragraph.add_run(
                                    Run::new()
                                        .add_text(text)
                                        .size(12 * 2)
                                        .fonts(RunFonts::new().east_asia("游明朝")),
                                );
                            }
                            DocxSegment::Ruby { base, ruby } => {
                                let id = format!("SHZK_RUBY_{:04}", placeholder_counter);
                                placeholder_counter += 1;

                                placeholders.push(DocxPlaceholder::Ruby {
                                    id: id.clone(),
                                    base: base.clone(),
                                    ruby: ruby.clone(),
                                });

                                paragraph = paragraph.add_run(
                                    Run::new()
                                        .add_text(&id)
                                        .size(12 * 2)
                                        .fonts(RunFonts::new().east_asia("游明朝")),
                                );
                            }
                            DocxSegment::EmphasisDot(text) => {
                                let id = format!("SHZK_EM_{:04}", placeholder_counter);
                                placeholder_counter += 1;

                                placeholders.push(DocxPlaceholder::EmphasisDot {
                                    id: id.clone(),
                                    text: text.clone(),
                                });

                                paragraph = paragraph.add_run(
                                    Run::new()
                                        .add_text(&id)
                                        .size(12 * 2)
                                        .fonts(RunFonts::new().east_asia("游明朝")),
                                );
                            }
                        }
                    }

                    docx = docx.add_paragraph(paragraph);
                }
            }

            docx = docx.add_paragraph(Paragraph::new());
        }
    }

    (docx, placeholders)
}

fn replace_placeholders(
    document_xml: Vec<u8>,
    placeholders: &[DocxPlaceholder],
) -> AppResult<Vec<u8>> {
    let mut xml = String::from_utf8(document_xml)
        .map_err(|e| AppError::Internal(format!("Document XML is not valid UTF-8: {}", e)))?;

    for placeholder in placeholders {
        match placeholder {
            DocxPlaceholder::Ruby { id, base, ruby } => {
                let search = format!(
                    r#"<w:r><w:rPr><w:sz w:val="24" /><w:szCs w:val="24" /><w:rFonts w:eastAsia="游明朝" /></w:rPr><w:t xml:space="preserve">{}</w:t></w:r>"#,
                    id
                );
                let replacement = generate_ruby_xml(base, ruby);
                xml = xml.replacen(&search, &replacement, 1);
            }
            DocxPlaceholder::EmphasisDot { id, text } => {
                let search = format!(
                    r#"<w:r><w:rPr><w:sz w:val="24" /><w:szCs w:val="24" /><w:rFonts w:eastAsia="游明朝" /></w:rPr><w:t xml:space="preserve">{}</w:t></w:r>"#,
                    id
                );
                let replacement = generate_emphasis_dot_xml(text);
                xml = xml.replacen(&search, &replacement, 1);
            }
        }
    }

    Ok(xml.into_bytes())
}

fn generate_ruby_xml(base: &str, ruby: &str) -> String {
    let escaped_base = escape_xml(base);
    let escaped_ruby = escape_xml(ruby);

    format!(
        concat!(
            r#"<w:r><w:ruby>"#,
            r#"<w:rubyPr>"#,
            r#"<w:rubyAlign w:val="distributeSpace" />"#,
            r#"<w:hps w:val="12" />"#,
            r#"<w:hpsRaise w:val="22" />"#,
            r#"<w:hpsBaseText w:val="24" />"#,
            r#"<w:lid w:val="ja-JP" />"#,
            r#"</w:rubyPr>"#,
            r#"<w:rt><w:r><w:rPr>"#,
            r#"<w:rFonts w:eastAsia="游明朝" />"#,
            r#"<w:sz w:val="12" /><w:szCs w:val="12" />"#,
            r#"</w:rPr><w:t>{}</w:t></w:r></w:rt>"#,
            r#"<w:rubyBase><w:r><w:rPr>"#,
            r#"<w:rFonts w:eastAsia="游明朝" />"#,
            r#"<w:sz w:val="24" /><w:szCs w:val="24" />"#,
            r#"</w:rPr><w:t>{}</w:t></w:r></w:rubyBase>"#,
            r#"</w:ruby></w:r>"#,
        ),
        escaped_ruby, escaped_base
    )
}

fn generate_emphasis_dot_xml(text: &str) -> String {
    let escaped_text = escape_xml(text);

    format!(
        concat!(
            r#"<w:r><w:rPr>"#,
            r#"<w:sz w:val="24" /><w:szCs w:val="24" />"#,
            r#"<w:rFonts w:eastAsia="游明朝" />"#,
            r#"<w:em w:val="dot" />"#,
            r#"</w:rPr><w:t xml:space="preserve">{}</w:t></w:r>"#,
        ),
        escaped_text
    )
}

fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_ruby_xml_basic() {
        let xml = generate_ruby_xml("漢字", "かんじ");
        assert!(xml.contains("<w:ruby>"));
        assert!(xml.contains("<w:t>かんじ</w:t>"));
        assert!(xml.contains("<w:t>漢字</w:t>"));
        assert!(xml.contains("<w:rubyAlign"));
        assert!(xml.contains(r#"w:val="ja-JP""#));
    }

    #[test]
    fn test_generate_ruby_xml_escapes_special_chars() {
        let xml = generate_ruby_xml("A&B", "a<b");
        assert!(xml.contains("<w:t>a&lt;b</w:t>"));
        assert!(xml.contains("<w:t>A&amp;B</w:t>"));
    }

    #[test]
    fn test_generate_emphasis_dot_xml_basic() {
        let xml = generate_emphasis_dot_xml("強調");
        assert!(xml.contains(r#"<w:em w:val="dot" />"#));
        assert!(xml.contains(r#"<w:t xml:space="preserve">強調</w:t>"#));
        assert!(xml.contains(r#"<w:rFonts w:eastAsia="游明朝" />"#));
    }

    #[test]
    fn test_generate_emphasis_dot_xml_escapes() {
        let xml = generate_emphasis_dot_xml("A&B");
        assert!(xml.contains(r#"<w:t xml:space="preserve">A&amp;B</w:t>"#));
    }

    #[test]
    fn test_replace_placeholders_ruby() {
        let input_xml = r#"<w:document><w:body><w:p><w:r><w:rPr><w:sz w:val="24" /><w:szCs w:val="24" /><w:rFonts w:eastAsia="游明朝" /></w:rPr><w:t xml:space="preserve">SHZK_RUBY_0000</w:t></w:r></w:p></w:body></w:document>"#;

        let placeholders = vec![DocxPlaceholder::Ruby {
            id: "SHZK_RUBY_0000".to_string(),
            base: "漢字".to_string(),
            ruby: "かんじ".to_string(),
        }];

        let result = replace_placeholders(input_xml.as_bytes().to_vec(), &placeholders).unwrap();
        let result_str = String::from_utf8(result).unwrap();

        assert!(!result_str.contains("SHZK_RUBY_0000"));
        assert!(result_str.contains("<w:ruby>"));
        assert!(result_str.contains("<w:t>かんじ</w:t>"));
        assert!(result_str.contains("<w:t>漢字</w:t>"));
    }

    #[test]
    fn test_replace_placeholders_emphasis_dot() {
        let input_xml = r#"<w:document><w:body><w:p><w:r><w:rPr><w:sz w:val="24" /><w:szCs w:val="24" /><w:rFonts w:eastAsia="游明朝" /></w:rPr><w:t xml:space="preserve">SHZK_EM_0000</w:t></w:r></w:p></w:body></w:document>"#;

        let placeholders = vec![DocxPlaceholder::EmphasisDot {
            id: "SHZK_EM_0000".to_string(),
            text: "強調".to_string(),
        }];

        let result = replace_placeholders(input_xml.as_bytes().to_vec(), &placeholders).unwrap();
        let result_str = String::from_utf8(result).unwrap();

        assert!(!result_str.contains("SHZK_EM_0000"));
        assert!(result_str.contains(r#"<w:em w:val="dot" />"#));
        assert!(result_str.contains("強調"));
    }

    #[test]
    fn test_replace_placeholders_mixed() {
        let input_xml = concat!(
            r#"<w:document><w:body><w:p>"#,
            r#"<w:r><w:rPr><w:sz w:val="24" /><w:szCs w:val="24" /><w:rFonts w:eastAsia="游明朝" /></w:rPr><w:t xml:space="preserve">SHZK_RUBY_0000</w:t></w:r>"#,
            r#"<w:r><w:rPr><w:sz w:val="24" /><w:szCs w:val="24" /><w:rFonts w:eastAsia="游明朝" /></w:rPr><w:t xml:space="preserve">の</w:t></w:r>"#,
            r#"<w:r><w:rPr><w:sz w:val="24" /><w:szCs w:val="24" /><w:rFonts w:eastAsia="游明朝" /></w:rPr><w:t xml:space="preserve">SHZK_EM_0001</w:t></w:r>"#,
            r#"</w:p></w:body></w:document>"#,
        );

        let placeholders = vec![
            DocxPlaceholder::Ruby {
                id: "SHZK_RUBY_0000".to_string(),
                base: "漢字".to_string(),
                ruby: "かんじ".to_string(),
            },
            DocxPlaceholder::EmphasisDot {
                id: "SHZK_EM_0001".to_string(),
                text: "強調".to_string(),
            },
        ];

        let result = replace_placeholders(input_xml.as_bytes().to_vec(), &placeholders).unwrap();
        let result_str = String::from_utf8(result).unwrap();

        assert!(!result_str.contains("SHZK_RUBY_0000"));
        assert!(!result_str.contains("SHZK_EM_0001"));
        assert!(result_str.contains("<w:ruby>"));
        assert!(result_str.contains(r#"<w:em w:val="dot" />"#));
        assert!(result_str.contains(r#"<w:t xml:space="preserve">の</w:t>"#));
    }

    #[test]
    fn test_replace_placeholders_empty() {
        let input_xml = "<w:document><w:body></w:body></w:document>";
        let result = replace_placeholders(input_xml.as_bytes().to_vec(), &[]).unwrap();
        let result_str = String::from_utf8(result).unwrap();
        assert_eq!(result_str, input_xml);
    }
}
