import {createEffect, onCleanup, onMount} from "solid-js";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import {PropsOverview} from "../models/OverviewData.ts";

const MAX_POINTS = 60;

function createCpuChart(container: HTMLDivElement, width: number): {
    plot: uPlot,
    times: number[],
    data: number[]
} {
    const now = Date.now() / 1000;
    const times: number[] = [];
    const data: number[] = [];

    for (let i = MAX_POINTS; i >= 0; i--) {
        times.push(now - i * 2);
        data.push(0);
    }

    const opts: uPlot.Options = {
        width,
        height: 200,
        // legend: {show: false},
        series: [
            {},
            {
                label: "CPU %",
                stroke: "#0d6efd",
                fill: "rgba(13, 110, 253, 0.1)",
                width: 2,
            },
        ],
        axes: [
            {stroke: "#aaa", ticks: {stroke: "#444"}},
            {stroke: "#aaa", ticks: {stroke: "#444"}},
        ],
        scales: {y: {min: 0, max: 100}},
    };

    const plot = new uPlot(opts, [new Float64Array(times), new Float64Array(data)], container);
    return {plot, times, data};
}

function createNetChart(container: HTMLDivElement, width: number): {
    plot: uPlot,
    times: number[],
    rx: number[],
    tx: number[]
} {
    const now = Date.now() / 1000;
    const times: number[] = [];
    const rx: number[] = [];
    const tx: number[] = [];

    for (let i = MAX_POINTS; i >= 0; i--) {
        times.push(now - i * 2);
        rx.push(0);
        tx.push(0);
    }

    const opts: uPlot.Options = {
        width,
        height: 200,
        // legend: {show: false},
        series: [
            {},
            {
                label: "RX",
                stroke: "#198754",
                fill: "rgba(25, 135, 84, 0.1)",
                width: 2,
            },
            {
                label: "TX",
                stroke: "#dc3545",
                fill: "rgba(220, 53, 69, 0.1)",
                width: 2,
            },
        ],
        axes: [
            {stroke: "#aaa", ticks: {stroke: "#444"}},
            {stroke: "#aaa", ticks: {stroke: "#444"}},
        ],
        scales: {y: {min: 0}},
    };

    const plot = new uPlot(opts, [new Float64Array(times), new Float64Array(rx), new Float64Array(tx)], container);
    return {plot, times, rx, tx};
}

export default function OverviewComponent(props: PropsOverview) {
    let cpuRef: HTMLDivElement | undefined;
    let netRef: HTMLDivElement | undefined;

    let cpuChart: ReturnType<typeof createCpuChart> | undefined;
    let netChart: ReturnType<typeof createNetChart> | undefined;

    onMount(() => {
        cpuChart = createCpuChart(cpuRef!, cpuRef!.clientWidth);
        netChart = createNetChart(netRef!, netRef!.clientWidth);

        const ro = new ResizeObserver(() => {
            cpuChart?.plot.setSize({width: cpuRef!.clientWidth, height: 200});
            netChart?.plot.setSize({width: netRef!.clientWidth, height: 200});
        });

        ro.observe(cpuRef!);
        ro.observe(netRef!);

        onCleanup(() => ro.disconnect());
    });

    createEffect(() => {
        const now = Date.now() / 1000;

        if (cpuChart) {
            cpuChart.times.push(now);
            cpuChart.data.push(props.overview.cpu_usage);
            if (cpuChart.times.length > MAX_POINTS) {
                cpuChart.times.shift();
                cpuChart.data.shift();
            }
            cpuChart.plot.setData([new Float64Array(cpuChart.times), new Float64Array(cpuChart.data)]);
        }

        if (netChart) {
            netChart.times.push(now);
            netChart.rx.push(props.overview.net_rx_kbps);
            netChart.tx.push(props.overview.net_tx_kbps);

            if (netChart.times.length > MAX_POINTS) {
                netChart.times.shift();
                netChart.rx.shift();
                netChart.tx.shift();
            }

            netChart.plot.setData([
                new Float64Array(netChart.times),
                new Float64Array(netChart.rx),
                new Float64Array(netChart.tx),
            ]);
        }
    });

    onCleanup(() => {
        cpuChart?.plot.destroy();
        netChart?.plot.destroy();
    });

    return (
        <div class="row g-3">
            <div class="col-md-6">
                <div class="card bg-dark text-white">
                    <div class="card-body">
                        <h6 class="card-title">
                            <i class="bi bi-cpu me-2"></i>
                            CPU — {props.overview.cpu_usage.toFixed(1)}%
                        </h6>
                        <div ref={cpuRef}></div>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="card bg-dark text-white">
                    <div class="card-body">
                        <h6 class="card-title">
                            <i class="bi bi-diagram-3 me-2"></i>
                            Rete — ↓ {props.overview.net_rx_kbps.toFixed(1)} KB/s
                            ↑ {props.overview.net_tx_kbps.toFixed(1)} KB/s
                        </h6>
                        <div ref={netRef}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}