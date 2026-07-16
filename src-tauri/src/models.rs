use serde::Serialize;
use std::path::PathBuf;
use std::sync::Mutex;
use sysinfo::{Disks, Networks, System};

pub struct AppState {
    pub sys: Mutex<System>,
    pub networks: Mutex<Networks>,
    pub disks: Mutex<Disks>,
}

/// Valori possibili da sysinfo process
///     name: OsString,
///     cmd: Vec<OsString>,
///     exe: Option<PathBuf>,
///     pid: Pid,
///     user_id: Option<Uid>,
///     environ: Vec<OsString>,
///     cwd: Option<PathBuf>,
///     root: Option<PathBuf>,
///     pub(crate) memory: u64,
///     pub(crate) virtual_memory: u64,
///     pub(crate) parent: Option<Pid>,
///     status: ProcessStatus,
///     handle: Option<Arc<HandleWrapper>>,
///     cpu_calc_values: CPUsageCalculationValues,
///     start_time: u64,
///     pub(crate) run_time: u64,
///     cpu_usage: f32,
///     pub(crate) updated: bool,
///     old_read_bytes: u64,
///     old_written_bytes: u64,
///     read_bytes: u64,
///     written_bytes: u64,
///     accumulated_cpu_time: u64,
///     exists: bool,
#[derive(Serialize, Clone)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu: f32,
    pub memory_mb: f64,
    pub user_id: Option<String>,
    pub read_bytes: u64,
    pub written_bytes: u64,
    pub accumulated_cpu_time: u64,
    pub cwd: Option<PathBuf>,
    pub root: Option<PathBuf>,
    pub start_time: String,
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
    pub net_interfaces: Vec<NetworkInterfaceInfo>,
    pub wifi_ssid: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct NetworkInterfaceInfo {
    pub name: String,
    pub rx_kbps: f64,
    pub tx_kbps: f64,
    pub ipv4: String,
    pub ipv6: String,
}
