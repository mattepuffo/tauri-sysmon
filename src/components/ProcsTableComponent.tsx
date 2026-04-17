import {For} from "solid-js";
import {PropsInfo} from "../models/ProcessInfo.ts";

export default function ProcsTableComponent(props: PropsInfo) {
    return (
        <div class="table-responsive" style={{height: "90vh", "overflow-y": "auto"}}>
            <table class="table table-striped table-bordered table-hover table-sm align-middle">
                <thead class="sticky-top table-dark">
                    <tr>
                        <th>PID</th>
                        <th>Nome</th>
                        <th>CPU %</th>
                        <th>RAM (MB)</th>
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
                            </tr>
                        )}
                    </For>
                </tbody>
            </table>
        </div>
    );
}