import {createSignal, onMount, onCleanup} from "solid-js";
import {invoke} from "@tauri-apps/api/core";
import ProcsTableComponent from "./components/ProcsTableComponent";
import {ProcessInfo} from "./models/ProcessInfo.ts";
import {Tab, Tabs} from "solid-bootstrap";
import OverviewComponent from "./components/OverviewComponent.tsx";
import {OverviewData} from "./models/OverviewData.ts";

export default function App() {
    const [key, setKey] = createSignal('overview');
    const [processes, setProcesses] = createSignal<ProcessInfo[]>([]);
    const [overview, setOverview] = createSignal<OverviewData>({cpu_usage: 0});

    let interval: number | undefined;

    onMount(() => {
        const fetchData = async () => {
            const [procs, ov] = await Promise.all([
                invoke<ProcessInfo[]>("get_processes"),
                invoke<OverviewData>("get_overview")
            ]);

            setProcesses(procs);
            setOverview(ov);
        };

        fetchData();
        interval = setInterval(fetchData, 2000);
    });

    onCleanup(() => clearInterval(interval));

    return (
        <div class="container-fluid p-3">
            <div class="row g-3">
                <div class="col">

                    <h4 class="mb-3">
                        <i class="bi bi-cpu me-2"></i>Task Manager
                    </h4>

                    <Tabs id="controlled-tab-example"
                          activeKey={key()}
                          onSelect={(k) => setKey(k)}
                          variant="pills"
                          class="mb-3">

                        <Tab eventKey="overview" title="Panoramica">
                            <OverviewComponent overview={overview()}/>
                        </Tab>

                        <Tab eventKey="processi" title="Processi">
                            <ProcsTableComponent processes={processes()}/>
                        </Tab>
                    </Tabs>

                </div>
            </div>
        </div>
    );
}