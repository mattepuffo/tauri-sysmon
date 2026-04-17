import {createEffect, onCleanup, onMount} from "solid-js";
import {PropsOverview} from "../models/OverviewData.ts";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

const MAX_POINTS = 60; // 60 campioni = 2 minuti a 2s di intervallo

export default function OverviewComponent(props: PropsOverview) {
    let chartRef: HTMLDivElement | undefined;
    let plot: uPlot | undefined;

    const times: number[] = [];
    const cpuData: number[] = [];

    onMount(() => {
        const now = Date.now() / 1000;
        for (let i = MAX_POINTS; i >= 0; i--) {
            times.push(now - i * 2);
            cpuData.push(0);
        }

        const opts: uPlot.Options = {
            width: chartRef!.clientWidth,
            height: 200,
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
                {
                    stroke: "#aaa",
                    ticks: {stroke: "#444"},
                    min: 0,
                    max: 100,
                },
            ],
            scales: {
                y: {min: 0, max: 100},
            },
            grid: {stroke: "#333"},
        };

        plot = new uPlot(opts, [new Float64Array(times), new Float64Array(cpuData)], chartRef!);

        const ro = new ResizeObserver(() => {
            plot?.setSize({width: chartRef!.clientWidth, height: 200});
        });
        ro.observe(chartRef!);
        onCleanup(() => ro.disconnect());
    });

    createEffect(() => {
        const cpu = props.overview.cpu_usage;
        if (!plot) return;

        const now = Date.now() / 1000;
        times.push(now);
        cpuData.push(cpu);

        if (times.length > MAX_POINTS) {
            times.shift();
            cpuData.shift();
        }

        plot.setData([new Float64Array(times), new Float64Array(cpuData)]);
    });

    onCleanup(() => plot?.destroy());

    return (
        <div class="row g-3">
            <div class="col">
                <div class="card bg-dark text-white">
                    <div class="card-body">
                        <h6 class="card-title">
                            <i class="bi bi-cpu me-2"></i>
                            CPU — {props.overview.cpu_usage.toFixed(1)}%
                        </h6>
                        <div ref={chartRef}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}