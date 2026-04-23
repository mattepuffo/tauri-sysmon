import {createEffect, onCleanup, onMount} from "solid-js";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import {PropsOverview} from "../models/OverviewData.ts";

const MAX_POINTS = 60;

function createCpuChart(container: HTMLDivElement, width: number): { plot: uPlot, times: number[], data: number[] } {
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
        legend: {show: false},
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
    plot: uPlot, times: number[], rx: number[], tx: number[]
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
        legend: {show: false},
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

function createMemChart(container: HTMLDivElement, width: number, totalMb: number, color: string): {
    plot: uPlot, times: number[], data: number[]
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
        legend: {show: false},
        series: [
            {},
            {
                stroke: color,
                fill: color.replace(")", ", 0.1)").replace("rgb", "rgba"),
                width: 2,
            },
        ],
        axes: [
            {stroke: "#aaa", ticks: {stroke: "#444"}},
            {stroke: "#aaa", ticks: {stroke: "#444"}},
        ],
        scales: {y: {min: 0, max: totalMb}},
    };

    const plot = new uPlot(opts, [new Float64Array(times), new Float64Array(data)], container);
    return {plot, times, data};
}

export default function OverviewComponent(props: PropsOverview) {
    let cpuRef: HTMLDivElement | undefined;
    let netRef: HTMLDivElement | undefined;
    let ramRef: HTMLDivElement | undefined;
    let swapRef: HTMLDivElement | undefined;

    let cpuChart: ReturnType<typeof createCpuChart> | undefined;
    let netChart: ReturnType<typeof createNetChart> | undefined;
    let ramChart: ReturnType<typeof createMemChart> | undefined;
    let swapChart: ReturnType<typeof createMemChart> | undefined;

    onMount(() => {
        cpuChart = createCpuChart(cpuRef!, cpuRef!.clientWidth);
        netChart = createNetChart(netRef!, netRef!.clientWidth);
        // RAM e swap NON vengono create qui perché non abbiamo ancora i totali

        const ro = new ResizeObserver(() => {
            cpuChart?.plot.setSize({width: cpuRef!.clientWidth, height: 200});
            netChart?.plot.setSize({width: netRef!.clientWidth, height: 200});
            ramChart?.plot.setSize({width: ramRef!.clientWidth, height: 200});
            swapChart?.plot.setSize({width: swapRef!.clientWidth, height: 200});
        });

        ro.observe(cpuRef!);
        ro.observe(netRef!);
        ro.observe(ramRef!);
        ro.observe(swapRef!);
        onCleanup(() => ro.disconnect());
    });

    createEffect(() => {
        const now = Date.now() / 1000;

        // Inizializzazione lazy: appena arrivano i totali, creiamo i grafici
        if (!ramChart && ramRef && props.overview.ram_total_mb > 0) {
            ramChart = createMemChart(ramRef, ramRef.clientWidth, props.overview.ram_total_mb, "#6f42c1");
        }
        if (!swapChart && swapRef && props.overview.swap_total_mb > 0) {
            swapChart = createMemChart(swapRef, swapRef.clientWidth, props.overview.swap_total_mb, "#fd7e14");
        }

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
            netChart.plot.setData([new Float64Array(netChart.times), new Float64Array(netChart.rx), new Float64Array(netChart.tx)]);
        }

        if (ramChart) {
            ramChart.times.push(now);
            ramChart.data.push(props.overview.ram_used_mb);
            if (ramChart.times.length > MAX_POINTS) {
                ramChart.times.shift();
                ramChart.data.shift();
            }
            ramChart.plot.setData([new Float64Array(ramChart.times), new Float64Array(ramChart.data)]);
        }

        if (swapChart) {
            swapChart.times.push(now);
            swapChart.data.push(props.overview.swap_used_mb);
            if (swapChart.times.length > MAX_POINTS) {
                swapChart.times.shift();
                swapChart.data.shift();
            }
            swapChart.plot.setData([new Float64Array(swapChart.times), new Float64Array(swapChart.data)]);
        }
    });

    onCleanup(() => {
        cpuChart?.plot.destroy();
        netChart?.plot.destroy();
        ramChart?.plot.destroy();
        swapChart?.plot.destroy();
    });

    return (
        <>
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

            <div class="row g-3 mt-1">
                <div class="col-md-6">
                    <div class="card bg-dark text-white">
                        <div class="card-body">
                            <h6 class="card-title">
                                <i class="bi bi-memory me-2"></i>
                                RAM
                                — {props.overview.ram_used_mb.toFixed(0)} / {props.overview.ram_total_mb.toFixed(0)} MB
                            </h6>
                            <div ref={ramRef}></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card bg-dark text-white">
                        <div class="card-body">
                            <h6 class="card-title">
                                <i class="bi bi-hdd me-2"></i>
                                Swap
                                — {props.overview.swap_used_mb.toFixed(0)} / {props.overview.swap_total_mb.toFixed(0)} MB
                            </h6>
                            <div ref={swapRef}></div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}