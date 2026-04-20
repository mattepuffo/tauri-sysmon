export interface OverviewData {
    cpu_usage: number;
    net_rx_kbps: number;
    net_tx_kbps: number;
}

export interface PropsOverview {
    overview: OverviewData;
}