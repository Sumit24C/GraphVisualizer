import { useState, useEffect, useRef, useCallback } from "react";
import { CustomButton } from "../components/CustomButton";
import { bfs, dfs, dijkstra, kruskal, topoSort } from "../utils/algorithms";
import { ALGORITHMS, NODE_COLORS, NODE_RADIUS, EDGE_COLORS } from "../constants";
import { drawGraph } from "../utils/graphBuilder/graph";

// ── distance / cost table shown beneath step log for relevant algorithms ───
function DistTable({ algo, nodes, step }) {
    if (!step || !["Dijkstra", "Kruskal"].includes(algo)) return null;

    const rows = nodes.map(n => {
        const raw = step.nodeStates?.[n.id];
        const val = typeof raw === "object"
            ? (raw?.dist !== undefined ? raw.dist : raw?.cost)
            : undefined;
        const state = typeof raw === "object" ? raw?.state : raw;
        return { n, val, state };
    });

    const label = algo === "Dijkstra" ? "dist" : "cost";

    return (
        <div className="mt-2">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{label} table</p>
            <div className="flex flex-wrap gap-1.5">
                {rows.map(({ n, val, state }) => {
                    const col = NODE_COLORS[state] ?? NODE_COLORS.default;
                    return (
                        <span
                            key={n.id}
                            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-mono border"
                            style={{
                                background: col.fill,
                                borderColor: col.stroke,
                                color: col.text,
                            }}
                        >
                            <span className="font-bold">{n.label}</span>
                            <span className="opacity-70">=</span>
                            <span>{val === undefined || val === Infinity ? "∞" : val}</span>
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

// ── edge cost summary for Kruskal / Dijkstra ──────────────────────────────
function EdgeCostBadge({ edges, edgeStates }) {
    const highlighted = edges.filter(e => {
        const s = edgeStates?.[e.id];
        return s && s !== "default";
    });
    if (!highlighted.length) return null;

    return (
        <div className="mt-2">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">highlighted edges</p>
            <div className="flex flex-wrap gap-1.5">
                {highlighted.map(e => {
                    const s = edgeStates[e.id];
                    const color = EDGE_COLORS[s] ?? EDGE_COLORS.default;
                    return (
                        <span
                            key={e.id}
                            className="text-xs px-2 py-0.5 rounded-md font-mono border"
                            style={{ borderColor: color, color }}
                        >
                            {e.from}→{e.to}  <span className="opacity-60">w=</span>{e.weight}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

// ── main component ────────────────────────────────────────────────────────
export default function GraphVisualizer() {
    const canvasRef = useRef(null);

    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    const [nodeLabel_, setNodeLabel_] = useState("");
    const [edgeFrom, setEdgeFrom] = useState("");
    const [edgeTo, setEdgeTo] = useState("");
    const [edgeWeight, setEdgeWeight] = useState(1);

    const [algo, setAlgo] = useState("BFS");
    const [startNode, setStartNode] = useState("");

    const [steps, setSteps] = useState([]);
    const [stepIndex, setStepIndex] = useState(0);
    const [running, setRunning] = useState(false);
    const [speed, setSpeed] = useState(700);

    // refs for animation loop — never stale
    const runningRef = useRef(false);
    const stepIndexRef = useRef(0);
    const stepsRef = useRef([]);
    const speedRef = useRef(700);
    const timerRef = useRef(null);

    // drag
    const draggingRef = useRef(null);
    const dragOffRef = useRef({ x: 0, y: 0 });

    // keep refs in sync
    useEffect(() => { runningRef.current = running; }, [running]);
    useEffect(() => { stepIndexRef.current = stepIndex; }, [stepIndex]);
    useEffect(() => { stepsRef.current = steps; }, [steps]);
    useEffect(() => { speedRef.current = speed; }, [speed]);

    const currentStep = steps[stepIndex - 1];
    const currentNodeStates = currentStep?.nodeStates ?? {};
    const currentEdgeStates = currentStep?.edgeStates ?? {};

    // redraw whenever graph or highlight state changes
    useEffect(() => {
        drawGraph(canvasRef.current, nodes, edges, currentNodeStates, currentEdgeStates);
    }, [nodes, edges, currentNodeStates, currentEdgeStates]);

    // resize observer
    useEffect(() => {
        const ro = new ResizeObserver(() => {
            drawGraph(canvasRef.current, nodes, edges, currentNodeStates, currentEdgeStates);
        });
        if (canvasRef.current) ro.observe(canvasRef.current);
        return () => ro.disconnect();
    });

    // ── canvas interaction ──────────────────────────────────────────────────
    const getPos = e => {
        const rect = canvasRef.current.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleCanvasClick = useCallback(e => {
        if (draggingRef.current) return;
        const { x, y } = getPos(e);
        const hit = nodes.find(n => Math.hypot(n.x - x, n.y - y) < NODE_RADIUS);
        if (!hit) {
            const id = Date.now();
            setNodes(prev => [
                ...prev,
                { id, label: String(prev.length + 1), x, y },
            ]);
        }
    }, [nodes]);

    const handleMouseDown = useCallback(e => {
        const { x, y } = getPos(e);
        const hit = nodes.find(n => Math.hypot(n.x - x, n.y - y) < NODE_RADIUS);
        if (hit) {
            draggingRef.current = hit.id;
            dragOffRef.current = { x: x - hit.x, y: y - hit.y };
        }
    }, [nodes]);

    const handleMouseMove = useCallback(e => {
        if (!draggingRef.current) return;
        const { x, y } = getPos(e);
        setNodes(prev => prev.map(n =>
            n.id === draggingRef.current
                ? { ...n, x: x - dragOffRef.current.x, y: y - dragOffRef.current.y }
                : n
        ));
    }, []);

    const handleMouseUp = useCallback(() => { draggingRef.current = null; }, []);

    // ── add node / edge ─────────────────────────────────────────────────────
    const addNode = () => {
        const id = Date.now();
        const label = nodeLabel_.trim() || String(nodes.length + 1);
        const W = canvasRef.current?.offsetWidth || 600;
        const H = canvasRef.current?.offsetHeight || 360;
        setNodes(prev => [...prev, {
            id, label,
            x: 60 + Math.random() * (W - 120),
            y: 60 + Math.random() * (H - 120),
        }]);
        setNodeLabel_("");
    };

    const addEdge = () => {
        if (!edgeFrom || !edgeTo || edgeFrom === edgeTo) return;
        const from = parseInt(edgeFrom), to = parseInt(edgeTo);
        if (edges.find(e => e.from === from && e.to === to)) return;
        setEdges(prev => [...prev, {
            id: Date.now(), from, to, weight: Number(edgeWeight) || 1,
        }]);
    };

    // ── animation loop ───────────────────────────────────────────────────────
    const tick = useCallback(() => {
        const idx = stepIndexRef.current;
        const total = stepsRef.current.length;
        if (!runningRef.current || idx >= total) {
            runningRef.current = false;
            setRunning(false);
            return;
        }
        const next = idx + 1;
        stepIndexRef.current = next;
        setStepIndex(next);
        timerRef.current = setTimeout(tick, speedRef.current);
    }, []);

    const handlePlayPause = useCallback(() => {
        // toggle state
        const nextRunning = !runningRef.current;

        setRunning(nextRunning);
        runningRef.current = nextRunning;

        clearTimeout(timerRef.current);

        if (nextRunning) {
            // start animation
            if (stepsRef.current.length === 0) return;
            timerRef.current = setTimeout(tick, speedRef.current);
        }
    }, [tick]);

    const handlePause = useCallback(() => {
        setRunning(false);
        runningRef.current = false;
        clearTimeout(timerRef.current);
    }, []);

    const handleRun = () => {
        handlePause();
        if (nodes.length === 0) return;
        const startId = startNode ? parseInt(startNode) : nodes[0].id;
        let result = [];
        if (algo === "BFS") result = bfs(nodes, edges, startId);
        else if (algo === "DFS") result = dfs(nodes, edges, startId);
        else if (algo === "Dijkstra") result = dijkstra(nodes, edges, startId);
        else if (algo === "Kruskal") result = kruskal(nodes, edges);
        else if (algo === "Topological Sort") result = topoSort(nodes, edges);
        stepsRef.current = result;
        stepIndexRef.current = 0;
        setSteps(result);
        setStepIndex(0);
    };

    const handleReset = () => {
        handlePause();
        stepsRef.current = [];
        stepIndexRef.current = 0;
        setSteps([]);
        setStepIndex(0);
    };

    const handleClear = () => {
        handleReset();
        setNodes([]);
        setEdges([]);
        setEdgeFrom("");
        setEdgeTo("");
        setStartNode("");
    };

    const stepForward = () => { if (stepIndex < steps.length) setStepIndex(i => i + 1); };
    const stepBack = () => { if (stepIndex > 0) setStepIndex(i => i - 1); };

    // step list auto-scroll
    const stepsListRef = useRef(null);
    const activeStepRef = useRef(null);
    useEffect(() => {
        activeStepRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [stepIndex]);

    // ── render ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-mono p-4 flex flex-col gap-3">

            {/* ── header ── */}
            <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold tracking-widest text-blue-400 uppercase">
                    Graph Visualizer
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {nodes.length} nodes · {edges.length} edges
                </span>
                {steps.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 border border-blue-800">
                        step {stepIndex} / {steps.length}
                    </span>
                )}
            </div>

            {/* ── add node / add edge ── */}
            <div className="grid grid-cols-2 gap-2">

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                    <p className="text-xs text-slate-500 uppercase tracking-widest">Add Node</p>
                    <div className="flex gap-2">
                        <input
                            value={nodeLabel_}
                            onChange={e => setNodeLabel_(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addNode()}
                            placeholder="Label (optional)"
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                        />
                        <CustomButton onClick={addNode} color="blue">+ Node</CustomButton>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                    <p className="text-xs text-slate-500 uppercase tracking-widest">Add Edge</p>
                    <div className="flex gap-2">
                        <select value={edgeFrom} onChange={e => setEdgeFrom(e.target.value)}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                            <option value="">From</option>
                            {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                        </select>
                        <select value={edgeTo} onChange={e => setEdgeTo(e.target.value)}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                            <option value="">To</option>
                            {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                        </select>
                        <input
                            type="number" value={edgeWeight} min={1}
                            onChange={e => setEdgeWeight(e.target.value)}
                            className="w-14 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 text-center"
                            placeholder="W"
                        />
                        <CustomButton onClick={addEdge} color="emerald">+ Edge</CustomButton>
                    </div>
                </div>
            </div>

            {/* ── canvas ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative"
                style={{ height: 340 }}>
                <canvas
                    ref={canvasRef}
                    style={{ width: "100%", height: "100%", cursor: "crosshair" }}
                    onClick={handleCanvasClick}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
                <p className="absolute bottom-2 right-3 text-xs text-slate-700">
                    click canvas to add node · drag to move
                </p>
            </div>

            {/* ── algorithm controls ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap gap-2 items-center">
                <select value={algo} onChange={e => setAlgo(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                    {ALGORITHMS.map(a => <option key={a}>{a}</option>)}
                </select>

                <select value={startNode} onChange={e => setStartNode(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                    <option value="">Start node</option>
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>

                <div className="flex gap-1.5 flex-wrap">
                    <CustomButton onClick={handleRun} color="blue">Run</CustomButton>
                    <CustomButton
                        onClick={handlePlayPause}
                        color={running ? "amber" : "emerald"}
                        disabled={steps.length === 0}
                    >
                        {running ? "⏸ Pause" : "▶ Play"}
                    </CustomButton>
                    <CustomButton onClick={stepBack} color="slate" disabled={stepIndex === 0}>‹ Prev</CustomButton>
                    <CustomButton onClick={stepForward} color="slate" disabled={stepIndex >= steps.length}>Next ›</CustomButton>
                    <CustomButton onClick={handleReset} color="slate">Reset</CustomButton>
                    <CustomButton onClick={handleClear} color="red">Clear all</CustomButton>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-slate-500">Speed</span>
                    <input
                        type="range" min={100} max={2000} step={100} value={speed}
                        onChange={e => { const v = Number(e.target.value); setSpeed(v); speedRef.current = v; }}
                        className="w-24 accent-blue-500"
                    />
                    <span className="text-xs text-slate-400 w-12">{speed}ms</span>
                </div>
            </div>

            {/* ── legend + step panel ── */}
            <div className="grid grid-cols-2 gap-2">

                {/* legend */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Legend</p>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(NODE_COLORS).map(([state, col]) => (
                            <span key={state} className="flex items-center gap-1.5 text-xs">
                                <span style={{ background: col.fill, border: `2px solid ${col.stroke}` }}
                                    className="w-3 h-3 rounded-full inline-block" />
                                <span className="text-slate-400 capitalize">{state}</span>
                            </span>
                        ))}
                    </div>

                    <p className="text-xs text-slate-500 uppercase tracking-widest mt-3 mb-1.5">Edge states</p>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(EDGE_COLORS).map(([state, color]) => (
                            <span key={state} className="flex items-center gap-1.5 text-xs">
                                <span style={{ background: color }} className="w-4 h-0.5 inline-block rounded" />
                                <span style={{ color }} className="capitalize">{state}</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* step log + dist table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Steps</p>
                        {steps.length > 0 && (
                            <span className="text-xs text-slate-600">{stepIndex}/{steps.length}</span>
                        )}
                    </div>

                    <div ref={stepsListRef}
                        className="overflow-y-auto flex flex-col gap-0.5"
                        style={{ maxHeight: 110 }}>
                        {steps.length === 0
                            ? <span className="text-xs text-slate-600">Run an algorithm to see steps.</span>
                            : steps.map((s, i) => (
                                <div
                                    key={i}
                                    ref={i === stepIndex - 1 ? activeStepRef : null}
                                    className={`text-xs px-2 py-1 rounded transition-colors ${i === stepIndex - 1
                                        ? "bg-blue-900/60 text-blue-300 font-semibold"
                                        : i < stepIndex
                                            ? "text-slate-500"
                                            : "text-slate-700"
                                        }`}
                                >
                                    {i + 1}. {s.label}
                                </div>
                            ))
                        }
                    </div>

                    {/* distance / cost table */}
                    <DistTable algo={algo} nodes={nodes} step={currentStep} />

                    {/* highlighted edge costs */}
                    <EdgeCostBadge edges={edges} edgeStates={currentEdgeStates} />
                </div>
            </div>
        </div>
    );
}