import {DiskInfo} from "./DisksInfo.ts";
import {NetworkInterfaceInfo} from "./NetworkInterfaceInfo.ts";

export interface OverviewData {
    cpu_usage: number;
    net_rx_kbps: number;
    net_tx_kbps: number;
    ram_used_mb: number;
    ram_total_mb: number;
    swap_used_mb: number;
    swap_total_mb: number;
    disks: DiskInfo[];
    net_interfaces: NetworkInterfaceInfo[];
    wifi_ssid: string;
}

export interface PropsOverview {
    overview: OverviewData;
}