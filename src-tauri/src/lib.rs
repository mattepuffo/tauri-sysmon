use crate::models::{AppState, OverviewData, ProcessInfo};
use std::sync::Mutex;
use sysinfo::System;
use tauri::{Manager, State};

mod models;

#[tauri::command]
fn get_processes(state: State<AppState>) -> Vec<ProcessInfo> {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_all();

    let mut processes: Vec<ProcessInfo> = sys
        .processes()
        .values()
        .map(|p| ProcessInfo {
            pid: p.pid().as_u32(),
            name: p.name().to_string_lossy().to_string(),
            cpu: p.cpu_usage(),
            memory_mb: p.memory() as f64 / 1024.0 / 1024.0,
        })
        .collect();

    processes.sort_by(|a, b| b.cpu.partial_cmp(&a.cpu).unwrap());
    processes
}

#[tauri::command]
fn get_cpu_usage(state: State<AppState>) -> f32 {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_cpu_all();
    sys.global_cpu_usage()
}

#[tauri::command]
fn get_overview(state: State<AppState>) -> OverviewData {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_cpu_all();
    OverviewData {
        cpu_usage: sys.global_cpu_usage(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let sys = System::new_all();

    tauri::Builder::default()
        .manage(AppState {
            sys: Mutex::new(sys),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_processes,
            get_cpu_usage,
            get_overview
        ])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = window.current_monitor() {
                    let size = monitor.size();
                    let scale_factor = monitor.scale_factor();

                    let width = (size.width as f64 * 0.8 / scale_factor) as u32;
                    let height = (size.height as f64 * 0.8 / scale_factor) as u32;

                    let _ = window
                        .set_size(tauri::Size::Physical(tauri::PhysicalSize { width, height }));

                    let _ = window.center();
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
