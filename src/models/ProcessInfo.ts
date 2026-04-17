export interface ProcessInfo {
    pid: number;
    name: string;
    cpu: number;
    memory_mb: number;
}

export interface PropsInfo {
    processes: ProcessInfo[];
}