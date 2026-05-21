use serde::Serialize;
use std::sync::Mutex;
use sysinfo::{Disks, Networks, System};

pub struct AppState {
    pub sys: Mutex<System>,
    pub networks: Mutex<Networks>,
    pub disks: Mutex<Disks>,
}

#[derive(Serialize, Clone)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu: f32,
    pub memory_mb: f64,
}

#[derive(Serialize, Clone)]
pub struct DiskInfo {
    pub name: String,
    pub used_gb: f64,
    pub total_gb: f64,
}

#[derive(Serialize, Clone)]
pub struct OverviewData {
    pub cpu_usage: f32,
    pub net_rx_kbps: f64,
    pub net_tx_kbps: f64,
    pub ram_used_mb: f64,
    pub ram_total_mb: f64,
    pub swap_used_mb: f64,
    pub swap_total_mb: f64,
    pub disks: Vec<DiskInfo>,
}