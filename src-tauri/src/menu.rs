use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder},
    App, AppHandle, Emitter, Manager, Runtime,
};

pub fn create_menu<R: Runtime>(app: &App<R>) -> Result<tauri::menu::Menu<R>, tauri::Error> {
    let about = PredefinedMenuItem::about(app, Some("About Shizuku Editor"), None)?;
    let settings = MenuItemBuilder::with_id("settings", "Settings…")
        .accelerator("Cmd+,")
        .build(app)?;
    let quit = PredefinedMenuItem::quit(app, Some("Quit Shizuku Editor"))?;

    let app_menu = SubmenuBuilder::new(app, "Shizuku Editor")
        .item(&about)
        .separator()
        .item(&settings)
        .separator()
        .item(&quit)
        .build()?;

    let new_scene = MenuItemBuilder::with_id("new_scene", "New Scene")
        .accelerator("Cmd+N")
        .build(app)?;
    let export = MenuItemBuilder::with_id("export", "Export…")
        .accelerator("Cmd+E")
        .build(app)?;

    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&new_scene)
        .separator()
        .item(&export)
        .build()?;

    let cut = PredefinedMenuItem::cut(app, Some("Cut"))?;
    let copy = PredefinedMenuItem::copy(app, Some("Copy"))?;
    let paste = PredefinedMenuItem::paste(app, Some("Paste"))?;
    let select_all = PredefinedMenuItem::select_all(app, Some("Select All"))?;
    let search = MenuItemBuilder::with_id("search", "Find…")
        .accelerator("Cmd+F")
        .build(app)?;

    let edit_menu = SubmenuBuilder::with_id(app, "edit_menu", "Edit")
        .item(&cut)
        .item(&copy)
        .item(&paste)
        .item(&select_all)
        .separator()
        .item(&search)
        .build()?;

    let theme_light = MenuItemBuilder::with_id("theme_light", "Light").build(app)?;
    let theme_dark = MenuItemBuilder::with_id("theme_dark", "Dark").build(app)?;
    let theme_submenu = SubmenuBuilder::new(app, "Theme")
        .item(&theme_light)
        .item(&theme_dark)
        .build()?;

    let split_view = MenuItemBuilder::with_id("split_view", "Split View")
        .accelerator("Cmd+\\")
        .build(app)?;
    let focus_mode = MenuItemBuilder::with_id("focus_mode", "Focus Mode")
        .accelerator("Cmd+Shift+F")
        .build(app)?;
    let view_menu = SubmenuBuilder::with_id(app, "view_menu", "View")
        .item(&theme_submenu)
        .separator()
        .item(&split_view)
        .separator()
        .item(&focus_mode)
        .build()?;

    let prev_scene = MenuItemBuilder::with_id("prev_scene", "Previous Scene")
        .accelerator("Cmd+[")
        .build(app)?;
    let next_scene = MenuItemBuilder::with_id("next_scene", "Next Scene")
        .accelerator("Cmd+]")
        .build(app)?;

    let navigate_menu = SubmenuBuilder::with_id(app, "navigate_menu", "Navigate")
        .item(&prev_scene)
        .item(&next_scene)
        .build()?;

    let help = MenuItemBuilder::with_id("help", "Help")
        .accelerator("Cmd+/")
        .build(app)?;

    let help_menu = SubmenuBuilder::new(app, "Help").item(&help).build()?;

    MenuBuilder::new(app)
        .item(&app_menu)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&view_menu)
        .item(&navigate_menu)
        .item(&help_menu)
        .build()
}

pub fn setup_menu_handlers<R: Runtime>(app: &App<R>) {
    app.on_menu_event(move |app, event| {
        let window = app.get_webview_window("main");

        match event.id().0.as_str() {
            "new_scene" => {
                if let Some(w) = &window {
                    let _ = w.emit("menu:new_scene", ());
                }
            }
            "export" => {
                if let Some(w) = &window {
                    let _ = w.emit("menu:export", ());
                }
            }
            "settings" => {
                if let Some(w) = &window {
                    let _ = w.emit("menu:settings", ());
                }
            }
            "search" => {
                if let Some(w) = &window {
                    let _ = w.emit("menu:search", ());
                }
            }

            "theme_light" => {
                if let Some(w) = &window {
                    let _ = w.emit("menu:theme", "light");
                }
            }
            "theme_dark" => {
                if let Some(w) = &window {
                    let _ = w.emit("menu:theme", "dark");
                }
            }
            "split_view" => {
                if let Some(w) = &window {
                    let _ = w.emit("menu:split_view", ());
                }
            }
            "focus_mode" => {
                if let Some(w) = &window {
                    let _ = w.emit("menu:toggle_focus_mode", ());
                }
            }
            "prev_scene" => {
                if let Some(w) = &window {
                    let _ = w.emit("menu:prev_scene", ());
                }
            }
            "next_scene" => {
                if let Some(w) = &window {
                    let _ = w.emit("menu:next_scene", ());
                }
            }

            "help" => {
                if let Some(w) = &window {
                    let _ = w.emit("menu:help", ());
                }
            }

            _ => {}
        }
    });
}

pub fn set_scene_menus_enabled(app_handle: AppHandle, enabled: bool) {
    let Some(menu) = app_handle.menu() else {
        return;
    };

    if let Some(edit_item) = menu.get("edit_menu") {
        if let Some(edit_submenu) = edit_item.as_submenu() {
            set_menu_item_enabled(edit_submenu, "search", enabled);
        }
    }

    if let Some(view_item) = menu.get("view_menu") {
        if let Some(view_submenu) = view_item.as_submenu() {
            set_menu_item_enabled(view_submenu, "split_view", enabled);
            set_menu_item_enabled(view_submenu, "focus_mode", enabled);
        }
    }

    if let Some(nav_item) = menu.get("navigate_menu") {
        if let Some(nav_submenu) = nav_item.as_submenu() {
            set_menu_item_enabled(nav_submenu, "prev_scene", enabled);
            set_menu_item_enabled(nav_submenu, "next_scene", enabled);
        }
    }
}

pub fn set_split_view_menu_enabled(app_handle: AppHandle, enabled: bool) {
    if let Some(menu) = app_handle.menu() {
        if let Some(view_item) = menu.get("view_menu") {
            if let Some(view_submenu) = view_item.as_submenu() {
                set_menu_item_enabled(view_submenu, "split_view", enabled);
            }
        }
    }
}

fn set_menu_item_enabled<R: Runtime>(submenu: &tauri::menu::Submenu<R>, id: &str, enabled: bool) {
    if let Some(item) = submenu.get(id) {
        if let Some(menu_item) = item.as_menuitem() {
            let _ = menu_item.set_enabled(enabled);
        }
    }
}
