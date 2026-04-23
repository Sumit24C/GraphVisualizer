import { useState, useEffect, useRef, useCallback } from "react";
import { CustomButton } from "../components/CustomButton";
import { bfs, dfs, dijkstra, bellmanFord, kruskal, topoSort } from "../utils/algorithms";
import { ALGORITHMS, NODE_COLORS, NODE_RADIUS, EDGE_COLORS } from "../constants";
import { drawGraph } from "../utils/graphBuilder/graph";
import DistTable from "../components/DistTable";
import EdgeCostBadge from "../components/EdgeCostBadge";

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

    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);

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
        drawGraph(
            canvasRef.current,
            nodes,
            edges,
            currentNodeStates,
            currentEdgeStates,
            selectedNode,
            selectedEdge
        );
    }, [nodes, edges, currentNodeStates, currentEdgeStates]);

    // resize observer
    useEffect(() => {
        const ro = new ResizeObserver(() => {
            drawGraph(
                canvasRef.current,
                nodes,
                edges,
                currentNodeStates,
                currentEdgeStates,
                selectedNode,
                selectedEdge
            );
        });
        if (canvasRef.current) ro.observe(canvasRef.current);
        return () => ro.disconnect();
    });

    const deleteNode = () => {
        if (!selectedNode) return;

        setNodes(prev => prev.filter(n => n.id !== selectedNode));
        setEdges(prev => prev.filter(e => e.from !== selectedNode && e.to !== selectedNode));
        setSelectedNode(null);
    };

    const deleteEdge = () => {
        if (!selectedEdge) return;

        setEdges(prev => prev.filter(e => e.id !== selectedEdge));
        setSelectedEdge(null);
    };

    const updateNodeLabel = (newLabel) => {
        setNodes(prev =>
            prev.map(n =>
                n.id === selectedNode ? { ...n, label: newLabel } : n
            )
        );
    };

    const updateEdgeWeight = (newWeight) => {
        setEdges(prev =>
            prev.map(e =>
                e.id === selectedEdge
                    ? { ...e, weight: Number(newWeight) }
                    : e
            )
        );
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Delete" || e.key === "Backspace") {

                // if node is selected → delete node
                if (selectedNode) {
                    deleteNode();
                    return;
                }

                // if edge is selected → delete edge
                if (selectedEdge) {
                    deleteEdge();
                    return;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedNode, selectedEdge]);

    // ── canvas interaction ──────────────────────────────────────────────────
    const getPos = e => {
        const rect = canvasRef.current.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    function pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;

        if (len_sq !== 0) param = dot / len_sq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    const handleCanvasClick = useCallback(e => {
        if (draggingRef.current) return;
        const { x, y } = getPos(e);
        const hit = nodes.find(n => Math.hypot(n.x - x, n.y - y) < NODE_RADIUS);
        if (hit) {
            setSelectedNode(hit.id);
            setSelectedEdge(null);
            return;
        }

        // detect edge click (basic proximity)
        const edgeHit = edges.find(e => {
            const from = nodes.find(n => n.id === e.from);
            const to = nodes.find(n => n.id === e.to);
            if (!from || !to) return false;

            const dist = pointToLineDistance(x, y, from.x, from.y, to.x, to.y);
            return dist < 6; // threshold
        });

        if (edgeHit) {
            setSelectedEdge(edgeHit.id);
            setSelectedNode(null);
            return;
        }

        // otherwise add node
        const id = Date.now();
        setNodes(prev => [...prev, { id, label: String(prev.length + 1), x, y }]);
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
            id: Date.now(), from, to, weight: edgeWeight === "" ? 1 : Number(edgeWeight),
        }]);
    };

    const handleJsonUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                // validation
                if (!data.nodes || !data.edges) {
                    alert("Invalid JSON: must contain nodes and edges");
                    return;
                }

                // normalize nodes
                const parsedNodes = data.nodes.map((n, i) => ({
                    id: n.id ?? Date.now() + i,
                    label: n.label ?? String(i + 1),
                    x: n.x ?? 100 + Math.random() * 300,
                    y: n.y ?? 100 + Math.random() * 200,
                }));

                // normalize edges
                const parsedEdges = data.edges.map((e, i) => ({
                    id: e.id ?? Date.now() + i + 1000,
                    from: e.from,
                    to: e.to,
                    weight: e.weight ?? 1,
                }));

                // reset + load
                handleReset();
                setNodes(parsedNodes);
                setEdges(parsedEdges);
                setSelectedNode(null);
                setSelectedEdge(null);

            } catch (err) {
                alert("Invalid JSON file");
            }
        };

        reader.readAsText(file);
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
        else if (algo === "Bellman-Ford") result = bellmanFord(nodes, edges, startId);
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
                    <div className="flex gap-2 items-center">
                        <input
                            value={nodeLabel_}
                            onChange={e => setNodeLabel_(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addNode()}
                            placeholder="Label (optional)"
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                        />

                        <CustomButton onClick={addNode} color="blue">+ Node</CustomButton>

                        {/* JSON Upload */}
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleJsonUpload}
                                className="hidden"
                            />
                            <span className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:border-blue-500">
                                Upload JSON
                            </span>
                        </label>
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
                            type="number" value={edgeWeight}
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
            {selectedNode && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex gap-2 items-center">
                    <span className="text-xs text-slate-400">Node</span>

                    <input
                        placeholder="Edit label"
                        onChange={(e) => updateNodeLabel(e.target.value)}
                        className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-sm"
                    />

                    <CustomButton onClick={deleteNode} color="red">
                        Delete Node
                    </CustomButton>
                    <CustomButton onClick={() => setSelectedNode(null)} color="red">
                        X
                    </CustomButton>
                </div>
            )}

            {selectedEdge && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex gap-2 items-center">
                    <span className="text-xs text-slate-400">Edge {selectedEdge}</span>

                    <input
                        type="number"
                        placeholder="Weight"
                        onChange={(e) => updateEdgeWeight(e.target.value)}
                        className="w-20 bg-slate-800 border border-slate-700 px-2 py-1 rounded text-sm"
                    />

                    <CustomButton onClick={deleteEdge} color="red">
                        Delete Edge
                    </CustomButton>

                    <CustomButton onClick={() => setSelectedEdge(null)} color="red">
                        X
                    </CustomButton>
                </div>
            )}
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
                    {/* <EdgeCostBadge edges={edges} edgeStates={currentEdgeStates} /> */}
                </div>
            </div>
        </div>
    );
}