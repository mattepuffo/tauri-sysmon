import {For} from "solid-js";
import {PropsInfo} from "../models/ProcessInfo.ts";

export default function ProcsTableComponent(props: PropsInfo) {
    return (
        <div>
            <div class="mb-3">
                <select
                    class="form-select form-select-sm w-auto"
                    value={props.filter}
                    onChange={(e) => props.onFilterChange(e.target.value)}
                >
                    <option value="all">Tutti</option>
                    <option value="own">Propri</option>
                    <option value="system">Di sistema</option>
                </select>
            </div>

            <div class="table-responsive" style={{height: "80vh", "overflow-y": "auto"}}>
                <table class="table table-striped table-bordered table-hover table-sm align-middle">
                    <thead class="sticky-top table-dark">
                        <tr>
                            <th>PID</th>
                            <th>Nome</th>
                            <th>CPU %</th>
                            <th>RAM (MB)</th>
                            <th>CPU TIME</th>
                            <th>Read Bytes</th>
                            <th>Written Bytes</th>
                            <th>CWD</th>
                            <th>ROOT</th>
                            <th>Start Time</th>
                            <th>USER</th>
                        </tr>
                    </thead>
                    <tbody>
                        <For each={props.processes}>
                            {(proc) => (
                                <tr>
                                    <td class="text-secondary">{proc.pid}</td>
                                    <td>{proc.name}</td>
                                    <td>
                                        <span
                                            class={
                                                proc.cpu > 10
                                                    ? "text-danger"
                                                    : proc.cpu > 2
                                                        ? "text-warning"
                                                        : "text-success"
                                            }
                                        >
                                            {proc.cpu.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td>{proc.memory_mb.toFixed(1)}</td>
                                    <td>{proc.accumulated_cpu_time}</td>
                                    <td>{proc.read_bytes}</td>
                                    <td>{proc.written_bytes}</td>
                                    <td>{proc.cwd}</td>
                                    <td>{proc.root}</td>
                                    <td>{proc.start_time}</td>
                                    <td>{proc.user_id}</td>
                                </tr>
                            )}
                        </For>
                    </tbody>
                </table>
            </div>
        </div>
    );
}