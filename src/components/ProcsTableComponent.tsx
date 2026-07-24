import {createSignal, For, Show} from "solid-js";
import {invoke} from "@tauri-apps/api/core";
import {PropsInfo} from "../models/ProcessInfo.ts";

const DEFAULT_COLS = ["pid", "name", "cpu", "memory_mb", "user_id"];
const STORAGE_KEY = "procs_visible_cols";

const loadVisibleCols = (): string[] => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_COLS;
};

const saveVisibleCols = (cols: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cols));
};

export default function ProcsTableComponent(props: PropsInfo) {
    const COLS = [
        {name: "pid", label: "PID"},
        {name: "name", label: "Nome"},
        {
            name: "cpu",
            label: "CPU %",
            render: (proc) => (
                <span class={proc.cpu > 10 ? "text-danger" : proc.cpu > 2 ? "text-warning" : "text-success"}>
                    {proc.cpu.toFixed(1)}%
                </span>
            ),
        },
        {name: "memory_mb", label: "RAM (MB)", render: (proc) => proc.memory_mb.toFixed(1)},
        {name: "accumulated_cpu_time", label: "CPU TIME"},
        {name: "read_bytes", label: "Read Bytes"},
        {name: "written_bytes", label: "Written Bytes"},
        {name: "cwd", label: "CWD"},
        {name: "root", label: "ROOT"},
        {name: "start_time", label: "Start Time"},
        {name: "user_id", label: "USER"},
    ];

    const [visibleCols, setVisibleCols] = createSignal<string[]>(loadVisibleCols());
    const [dropdownOpen, setDropdownOpen] = createSignal(false);

    const toggleCol = (name: string) => {
        const current = visibleCols();
        const updated = current.includes(name)
            ? current.filter(c => c !== name)
            : [...current, name];
        setVisibleCols(updated);
        saveVisibleCols(updated);
    };

    const visibleColDefs = () => COLS.filter(c => visibleCols().includes(c.name));

    const killProcess = async (pid: number) => {
        const ok = await invoke<boolean>("kill_process", {pid});
        if (!ok) alert(`Impossibile terminare il processo ${pid}`);
    };

    return (
        <div>
            <div class="mb-3 d-flex gap-2">
                <select class="form-select form-select-sm w-auto"
                        value={props.filter}
                        onChange={(e) => props.onFilterChange(e.target.value)}>
                    <option value="all">Tutti</option>
                    <option value="own">Propri</option>
                    <option value="system">Di sistema</option>
                </select>

                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle"
                            onClick={() => setDropdownOpen(!dropdownOpen())}>
                        <i class="bi bi-columns me-1"></i>Colonne
                    </button>
                    <Show when={dropdownOpen()}>
                        <div class="dropdown-menu show p-2"
                             style={{"min-width": "160px", position: "fixed", "z-index": 1050}}>
                            <For each={COLS}>
                                {(col) => (
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id={`col-${col.name}`}
                                            checked={visibleCols().includes(col.name)}
                                            onChange={() => toggleCol(col.name)}
                                        />
                                        <label class="form-check-label" for={`col-${col.name}`}>
                                            {col.label}
                                        </label>
                                    </div>
                                )}
                            </For>
                        </div>
                    </Show>
                </div>
            </div>

            <div class="table-responsive" style={{height: "80vh", "overflow-y": "auto"}}>
                <table class="table table-striped table-bordered table-hover table-sm align-middle">
                    <thead class="sticky-top table-dark">
                        <tr>
                            <For each={visibleColDefs()}>
                                {(col) => <th>{col.label}</th>}
                            </For>
                            <th style={{width: "60px"}}></th>
                        </tr>
                    </thead>
                    <tbody>
                        <For each={props.processes}>
                            {(proc) => (
                                <tr>
                                    <For each={visibleColDefs()}>
                                        {(col) => (
                                            <td>{col.render ? col.render(proc) : proc[col.name]}</td>
                                        )}
                                    </For>
                                    <td>
                                        <button
                                            class="btn btn-danger btn-sm py-0 px-1"
                                            title="Termina processo"
                                            onClick={() => killProcess(proc.pid)}
                                        >
                                            <i class="bi bi-x-lg"></i>
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </For>
                    </tbody>
                </table>
            </div>
        </div>
    );
}