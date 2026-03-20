use std::sync::OnceLock;

use font_kit::source::SystemSource;

static SYSTEM_FONTS: OnceLock<Vec<String>> = OnceLock::new();

pub fn list_system_fonts() -> &'static Vec<String> {
    SYSTEM_FONTS.get_or_init(|| {
        let families = SystemSource::new().all_families().unwrap_or_default();

        let mut fonts: Vec<String> = families
            .into_iter()
            .filter(|name| !name.starts_with('.') && !name.starts_with('#'))
            .collect();

        fonts.sort_by_key(|a| a.to_lowercase());
        fonts.dedup();
        fonts
    })
}
