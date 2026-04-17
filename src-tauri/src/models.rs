use sysinfo::System;
use std::sync::Mutex;
use serde::Serialize;

pub struct AppState {
    pub sys: Mutex<System>,
}

#[derive(Serialize, Clone)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu: f32,
    pub memory_mb: f64,
}

#[derive(Serialize, Clone)]
pub struct OverviewData {
    pub cpu_usage: f32,
}