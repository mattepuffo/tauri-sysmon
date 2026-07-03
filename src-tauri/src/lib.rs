use crate::models::{AppState, DiskInfo, NetworkInterfaceInfo, OverviewData, ProcessInfo};
use std::sync::Mutex;
use sysinfo::{Disks, Networks, System};
use tauri::{Manager, State};
use crate::utils::get_wifi_ssid;

mod models;
mod utils;

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

    println!("{:?}", get_wifi_ssid());

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
