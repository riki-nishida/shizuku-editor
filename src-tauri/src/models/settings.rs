use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    #[default]
    Light,
    Dark,
    Sepia,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum FontFamilyPreset {
    #[default]
    System,
    Serif,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(untagged)]
pub enum FontFamily {
    Preset(FontFamilyPreset),
    Custom(String),
}

impl Default for FontFamily {
    fn default() -> Self {
        FontFamily::Preset(FontFamilyPreset::System)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum WritingMode {
    #[default]
    Horizontal,
    Vertical,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum MarkupDisplayMode {
    Wysiwyg,
    #[default]
    Notation,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EditorSettings {
    #[serde(default = "default_font_size")]
    pub font_size: i32,
    #[serde(default)]
    pub font_family: FontFamily,
    #[serde(default = "default_line_height")]
    pub line_height: f64,
    #[serde(default)]
    pub writing_mode: WritingMode,
    #[serde(default)]
    pub markup_display_mode: MarkupDisplayMode,
    #[serde(default)]
    pub auto_indent: bool,
    #[serde(default)]
    pub focus_mode: bool,
}

fn default_font_size() -> i32 {
    16
}

fn default_line_height() -> f64 {
    1.8
}

impl Default for EditorSettings {
    fn default() -> Self {
        Self {
            font_size: 16,
            font_family: FontFamily::default(),
            line_height: 1.8,
            writing_mode: WritingMode::Horizontal,
            markup_display_mode: MarkupDisplayMode::Notation,
            auto_indent: false,
            focus_mode: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ThemeSettings {
    pub theme: Theme,
}

impl Default for ThemeSettings {
    fn default() -> Self {
        Self {
            theme: Theme::Light,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct OnboardingSettings {
    #[serde(default)]
    pub has_seen_splash: bool,
    #[serde(default)]
    pub has_completed_onboarding: bool,
    #[serde(default)]
    pub last_reminder_shown_at: Option<String>,
    #[serde(default)]
    pub reminder_dismiss_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    Ja,
    En,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct ExportPerFormat {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ruby_mode: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mode: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub page_size: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub writing_mode: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct ExportSettings {
    #[serde(default)]
    pub txt: ExportPerFormat,
    #[serde(default)]
    pub docx: ExportPerFormat,
    #[serde(default)]
    pub pdf: ExportPerFormat,
    #[serde(default)]
    pub epub: ExportPerFormat,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub editor: EditorSettings,
    pub theme: ThemeSettings,
    #[serde(default)]
    pub onboarding: OnboardingSettings,
    #[serde(default)]
    pub language: Option<Language>,
    #[serde(default)]
    pub export: ExportSettings,
    pub version: u32,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            editor: EditorSettings::default(),
            theme: ThemeSettings::default(),
            onboarding: OnboardingSettings::default(),
            language: None,
            export: ExportSettings::default(),
            version: 1,
        }
    }
}
