export interface OverviewData {
    cpu_usage: number;
    net_rx_kbps: number;
    net_tx_kbps: number;
    ram_used_mb: number;
    ram_total_mb: number;
    swap_used_mb: number;
    swap_total_mb: number;
}

export interface PropsOverview {
    overview: OverviewData;
}