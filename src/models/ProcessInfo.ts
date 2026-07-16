export interface ProcessInfo {
    pid: number;
    name: string;
    cpu: number;
    memory_mb: number;
    user_id: string;
    read_bytes: number;
    written_bytes: number;
    accumulated_cpu_time: number;
    cwd: string;
    root: string;
    start_time: string;
}

export interface PropsInfo {
    processes: ProcessInfo[];
    filter: string;
    onFilterChange: (filter: string) => void;
}