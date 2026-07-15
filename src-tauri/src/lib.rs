use crate::models::{AppState, DiskInfo, NetworkInterfaceInfo, OverviewData, ProcessInfo};
use crate::utils::get_wifi_ssid;
use crate::window_state::WindowState;
use serde_json::json;
use std::sync::Mutex;
use sysinfo::{Disks, Networks, System};
use tauri::{Manager, PhysicalSize, State, WindowEvent};
use tauri_plugin_store::StoreExt;

mod models;
mod utils;
mod window_state;

#[tauri::command]
fn get_processes(state: State<AppState>, filter: String) -> Vec<ProcessInfo> {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_all();

    let current_uid = sysinfo::get_current_pid()
        .ok()
        .and_then(|pid| sys.process(pid))
        .and_then(|p| p.user_id())
        .cloned();

    let mut processes: Vec<ProcessInfo> = sys
        .processes()
        .values()
        .filter(|p| match filter.as_str() {
            "own" => p.user_id() == current_uid.as_ref(),
            "system" => p.user_id() != current_uid.as_ref(),
            _ => true, // "all"
        })
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
    let mut networks = state.networks.lock().unwrap();
    let disks = state.disks.lock().unwrap();

    sys.refresh_cpu_all();
    sys.refresh_memory();
    networks.refresh(true);

    let net_interfaces: Vec<NetworkInterfaceInfo> = networks
        .iter()
        .map(|(name, net)| {
            let ipv4 = net
                .ip_networks()
                .iter()
                .find(|ip| ip.addr.is_ipv4())
                .map(|ip| ip.addr.to_string())
                .unwrap_or_default();

            let ipv6 = net
                .ip_networks()
                .iter()
                .find(|ip| ip.addr.is_ipv6())
                .map(|ip| ip.addr.to_string())
                .unwrap_or_default();

            NetworkInterfaceInfo {
                name: name.clone(),
                rx_kbps: net.received() as f64 / 1024.0 / 2.0,
                tx_kbps: net.transmitted() as f64 / 1024.0 / 2.0,
                ipv4,
                ipv6,
            }
        })
        .collect();

    let total_rx = net_interfaces.iter().fold(0.0, |acc, i| acc + i.rx_kbps);
    let total_tx = net_interfaces.iter().fold(0.0, |acc, i| acc + i.tx_kbps);

    let disk_list = disks
        .iter()
        .map(|d| DiskInfo {
            name: d.mount_point().to_string_lossy().to_string(),
            used_gb: (d.total_space() - d.available_space()) as f64 / 1024.0 / 1024.0 / 1024.0,
            total_gb: d.total_space() as f64 / 1024.0 / 1024.0 / 1024.0,
        })
        .collect();

    OverviewData {
        cpu_usage: sys.global_cpu_usage(),
        net_rx_kbps: total_rx,
        net_tx_kbps: total_tx,
        ram_used_mb: sys.used_memory() as f64 / 1024.0 / 1024.0,
        ram_total_mb: sys.total_memory() as f64 / 1024.0 / 1024.0,
        swap_used_mb: sys.used_swap() as f64 / 1024.0 / 1024.0,
        swap_total_mb: sys.total_swap() as f64 / 1024.0 / 1024.0,
        disks: disk_list,
        net_interfaces,
        wifi_ssid: get_wifi_ssid(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let sys = System::new_all();
    let networks = Networks::new_with_refreshed_list();
    let disks = Disks::new_with_refreshed_list();

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(AppState {
            sys: Mutex::new(sys),
            networks: Mutex::new(networks),
            disks: Mutex::new(disks),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_processes,
            get_cpu_usage,
            get_overview
        ])
        .setup(|app| {
            let store = app.store("msymon_settings.json")?;
            let store_settings: WindowState = store
                .get("settings")
                .and_then(|value| serde_json::from_value(value).ok())
                .unwrap_or(WindowState {
                    is_maximized: false,
                });

            if let Some(window) = app.get_webview_window("main") {
                if store_settings.is_maximized {
                    let _ = window.maximize();
                } else {
                    if let Ok(Some(monitor)) = window.current_monitor() {
                        let size = monitor.size();
                        let scale_factor = monitor.scale_factor();

                        let width = (size.width as f64 * 0.8 / scale_factor) as u32;
                        let height = (size.height as f64 * 0.8 / scale_factor) as u32;

                        let _ =
                            window.set_size(tauri::Size::Physical(PhysicalSize { width, height }));

                        let _ = window.center();
                    }
                }
            }

            let main_window = app
                .get_webview_window("main")
                .expect("main window not found");

            // SALVATAGGIO STATO ALLA CHIUSURA
            main_window.on_window_event({
                let window = main_window.clone();

                move |event| {
                    if let WindowEvent::CloseRequested { .. } = event {
                        if let Ok(is_maximized) = window.is_maximized() {
                            store.set("settings", json!(WindowState { is_maximized }));
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
