mod commands;
pub mod db;
mod error;
pub mod menu;
pub mod models;
pub mod repositories;
pub mod services;

pub use error::{AppError, AppResult};

use tauri::Manager;
#[cfg(target_os = "windows")]
use tauri_plugin_decorum::WebviewWindowExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_decorum::init())
        .setup(|app| {
            let handle = app.handle();
            let pool = tauri::async_runtime::block_on(db::init_pool(handle))?;
            app.manage(pool);

            if cfg!(target_os = "macos") {
                let menu = menu::create_menu(app)?;
                app.set_menu(menu)?;
                menu::setup_menu_handlers(app);
            }

            #[cfg(target_os = "windows")]
            if let Some(main_window) = app.get_webview_window("main") {
                let _ = main_window.create_overlay_titlebar();
            }

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(commands::handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
