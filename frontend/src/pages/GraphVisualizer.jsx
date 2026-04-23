import { useState, useEffect, useRef, useCallback } from "react";
import { CustomButton } from "../components/CustomButton";
import { bfs, dfs, dijkstra, bellmanFord, kruskal, topoSort } from "../utils/algorithms";
import { ALGORITHMS, NODE_COLORS, NODE_RADIUS, EDGE_COLORS, BASE_URL } from "../constants";
import { drawGraph, loadGraph } from "../utils/graphBuilder/graph";
import DistTable from "../components/DistTable";
import EdgeCostBadge from "../components/EdgeCostBadge";
import Legend from "../components/Legend";
import Header from "../components/Header";
import StatsBar from "../components/StatsBar";
import GraphManager from "../components/GraphManager";

import { btnDanger, btnNeutral, btnPrimary, selectClass, THEMES } from "../Theme";
import { useNavigate, useParams } from "react-router-dom";

export default function GraphVisualizer() {
    const canvasRef = useRef(null);
    const [theme, setTheme] = useState("dark");

    const T = THEMES[theme];
    const { id } = useParams();
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const [currentGraphId, setCurrentGraphId] = useState(null);
    const [loading, setLoading] = useState(true);

    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    useEffect(() => {
        if (!token) return;

        const init = async () => {
            setLoading(true);

            if (id === "new") {
                const res = await fetch(`${BASE_URL}/graph`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ nodes: [], edges: [] })
                });

                const data = await res.json();
                navigate(`/graph/${data._id}`, { replace: true });
                return;
            }

            const res = await fetch(`${BASE_URL}/graph/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                navigate("/graph/new");
                return;
            }

            const data = await res.json();

            setNodes(data.nodes || []);
            setEdges(data.edges || []);
            setCurrentGraphId(id);
            setLoading(false);
        };

        init();
    }, [id]);

    useEffect(() => {
        if (!currentGraphId || !token) return;

        const t = setTimeout(() => {
            fetch(`${BASE_URL}/graph/${currentGraphId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ nodes, edges })
            });
        }, 800);

        return () => clearTimeout(t);

    }, [nodes, edges]);

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

    const [edgeStartNode, setEdgeStartNode] = useState(null);
    const [tempEdgePos, setTempEdgePos] = useState(null);

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

    useEffect(() => {
        const data = {
            nodes,
            edges
        };

        localStorage.setItem("graph-data", JSON.stringify(data));
    }, [nodes, edges]);

    // redraw whenever graph or highlight state changes
    useEffect(() => {
        drawGraph(
            canvasRef.current,
            nodes,
            edges,
            currentNodeStates,
            currentEdgeStates,
            selectedNode,
            selectedEdge,
            edgeStartNode,
            tempEdgePos
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
                selectedEdge,
                edgeStartNode,
                tempEdgePos
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

    const handleDoubleClick = useCallback((e) => {
        const { x, y } = getPos(e);

        const hit = nodes.find(n => Math.hypot(n.x - x, n.y - y) < NODE_RADIUS);

        if (edgeStartNode && !hit) {
            setEdgeStartNode(null);
            setTempEdgePos(null);
            return;
        }

        if (hit) {
            setEdgeStartNode(hit.id);
            setTempEdgePos({ x: hit.x, y: hit.y });
        }
    }, [nodes, edgeStartNode]);

    const handleCanvasClick = useCallback(e => {
        if (draggingRef.current) return;

        const { x, y } = getPos(e);

        const hit = nodes.find(n => Math.hypot(n.x - x, n.y - y) < NODE_RADIUS);
        // detect edge click FIRST
        const edgeHit = edges.find(e => {
            const from = nodes.find(n => n.id === e.from);
            const to = nodes.find(n => n.id === e.to);
            if (!from || !to) return false;

            const dist = pointToLineDistance(x, y, from.x, from.y, to.x, to.y);
            return dist < 8; // threshold
        });

        if (edgeHit) {
            setSelectedEdge(edgeHit.id);
            setSelectedNode(null);
            return;
        }

        if (edgeStartNode) {
            if (hit && hit.id !== edgeStartNode) {

                // prevent duplicate
                if (!edges.find(e => e.from === edgeStartNode && e.to === hit.id)) {
                    setEdges(prev => [...prev, {
                        id: Date.now(),
                        from: edgeStartNode,
                        to: hit.id,
                        weight: 1
                    }]);
                }
            }

            // reset mode
            setEdgeStartNode(null);
            setTempEdgePos(null);
            return;
        }

        // existing selection logic
        if (hit) {
            setSelectedNode(hit.id);
            setSelectedEdge(null);
            return;
        }

        // add node (existing)
        const id = Date.now();
        setNodes(prev => [...prev, { id, label: String(prev.length + 1), x, y }]);

    }, [nodes, edges, edgeStartNode]);

    const handleMouseDown = useCallback(e => {
        const { x, y } = getPos(e);
        const hit = nodes.find(n => Math.hypot(n.x - x, n.y - y) < NODE_RADIUS);
        if (hit) {
            draggingRef.current = hit.id;
            dragOffRef.current = { x: x - hit.x, y: y - hit.y };
        }
    }, [nodes]);

    const handleMouseMove = useCallback(e => {
        const { x, y } = getPos(e);

        if (draggingRef.current) {
            setNodes(prev => prev.map(n =>
                n.id === draggingRef.current
                    ? { ...n, x: x - dragOffRef.current.x, y: y - dragOffRef.current.y }
                    : n
            ));
            return;
        }

        if (edgeStartNode) {
            setTempEdgePos({ x, y });
        }

    }, [edgeStartNode]);

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


    if (loading) {
        return <div className="text-white p-4">Loading graph...</div>;
    }

    return (
        <div className={`min-h-screen ${T.bg} ${T.text} font-mono p-4 flex flex-col gap-4`}>

            {/* ── header ── */}
            {/* <div className="flex items-center gap-3">
                <h1 className={`text-lg font-semibold tracking-wide ${T.accent}`}>
                    Graph Visualizer
                </h1>

                <span className={`text-xs px-2 py-0.5 rounded ${T.panel} border ${T.border} ${T.subtext}`}>
                    {nodes.length} nodes · {edges.length} edges
                </span>

                {steps.length > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded ${T.panel} border ${T.border} ${T.accent}`}>
                        {stepIndex}/{steps.length}
                    </span>
                )}

                <div className="ml-auto">
                    <button
                        onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
                        className={`px-3 py-1 rounded-md text-sm ${T.button}`}
                    >
                        {theme === "dark" ? "Light" : "Dark"}
                    </button>
                </div>
            </div> */}
            <Header theme={theme} setTheme={setTheme} T={T} />

            <div className="flex gap-3 items-stretch">

                {/* Add Node (reduced width) */}
                <div className={`${T.panel} border ${T.border} rounded-lg px-3 py-2 flex items-center gap-2`}>

                    <GraphManager
                        nodes={nodes}
                        edges={edges}
                        setNodes={setNodes}
                        setEdges={setEdges}
                        currentGraphId={currentGraphId}
                        setCurrentGraphId={setCurrentGraphId}
                        onGraphLoaded={(id) => {
                            setCurrentGraphId(id);
                            navigate(`/graph/${id}`);
                        }}
                        T={T}
                    />
                    
                    <input
                        value={nodeLabel_}
                        onChange={e => setNodeLabel_(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addNode()}
                        placeholder="Node"
                        className="w-28 bg-transparent border border-neutral-600 rounded px-2 py-1 text-sm outline-none focus:border-green-500"
                    />

                    <button
                        onClick={addNode}
                        className="px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white text-sm"
                    >
                        +
                    </button>

                    <label className="cursor-pointer">
                        <input type="file" accept=".json" onChange={handleJsonUpload} className="hidden" />
                        <span className={`px-2 py-1 text-xs rounded ${T.button}`}>JSON</span>
                    </label>
                </div>

                {/* Add Edge */}
                <div className={`${T.panel} border ${T.border} rounded-lg px-3 py-2 flex items-center gap-2`}>

                    <select
                        value={edgeFrom}
                        onChange={e => setEdgeFrom(e.target.value)}
                        className={`${selectClass(T)} w-24`}
                    >
                        <option value="">From</option>
                        {nodes.map(n => (
                            <option key={n.id} value={n.id}>{n.label}</option>
                        ))}
                    </select>

                    <select
                        value={edgeTo}
                        onChange={e => setEdgeTo(e.target.value)}
                        className={`${selectClass(T)} w-24`}
                    >
                        <option value="">To</option>
                        {nodes.map(n => (
                            <option key={n.id} value={n.id}>{n.label}</option>
                        ))}
                    </select>

                    <input
                        type="number"
                        value={edgeWeight}
                        onChange={e => setEdgeWeight(e.target.value)}
                        className="w-16 bg-transparent border border-neutral-600 rounded px-2 py-1 text-sm text-center"
                    />

                    <button
                        onClick={addEdge}
                        className="px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white text-sm"
                    >
                        +
                    </button>
                </div>

            </div>

            {/* ── canvas ── */}
            <div className={`${T.panel} border ${T.border} rounded-lg overflow-hidden`} style={{ height: 360 }}>
                <canvas
                    ref={canvasRef}
                    style={{ width: "100%", height: "100%", cursor: "crosshair" }}
                    onClick={handleCanvasClick}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onDoubleClick={handleDoubleClick}
                />
            </div>

            {/* ── selection panels ── */}
            {selectedNode && (
                <div className={`${T.panel} border ${T.border} rounded-lg p-3 flex gap-2 items-center`}>
                    <input
                        placeholder="Label"
                        onChange={(e) => updateNodeLabel(e.target.value)}
                        className="border border-neutral-600 px-2 py-1 rounded text-sm"
                    />
                    <button onClick={deleteNode} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                    <button onClick={() => setSelectedNode(null)} className="px-3 py-1 bg-red-600 text-white rounded">X</button>

                </div>
            )}

            {selectedEdge && (
                <div className={`${T.panel} border ${T.border} rounded-lg p-3 flex gap-2 items-center`}>
                    <input
                        type="number"
                        onChange={(e) => updateEdgeWeight(e.target.value)}
                        className="w-20 border border-neutral-600 px-2 py-1 rounded text-sm"
                    />
                    <button onClick={deleteEdge} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                    <button onClick={() => setSelectedEdge(null)} className="px-3 py-1 bg-red-600 text-white rounded">X</button>

                </div>
            )}

            {/* ── controls ── */}
            <div className={`${T.panel} border ${T.border} rounded-lg p-3 flex flex-wrap gap-2`}>

                <select
                    value={algo}
                    onChange={e => setAlgo(e.target.value)}
                    className={`${selectClass(T)}`}
                >
                    {ALGORITHMS.map(a => <option key={a}>{a}</option>)}
                </select>

                <div className="relative">
                    <select
                        value={startNode}
                        onChange={e => setStartNode(e.target.value)}
                        className={`${selectClass(T)} w-full`}
                    >
                        <option value="">Start</option>
                        {nodes.map(n => (
                            <option key={n.id} value={n.id}>
                                {n.label}
                            </option>
                        ))}
                    </select>

                    {/* custom arrow */}
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                        ▼
                    </span>
                </div>

                <button onClick={handleRun} className={btnPrimary}>
                    Run
                </button>

                <button onClick={handlePlayPause} className={btnNeutral(T)}>
                    {running ? "Pause" : "Play"}
                </button>

                <button onClick={stepBack} className={`${btnNeutral(T)} px-2`}>
                    ‹
                </button>

                <button onClick={stepForward} className={`${btnNeutral(T)} px-2`}>
                    ›
                </button>

                <button onClick={handleReset} className={btnNeutral(T)}>
                    Reset
                </button>

                <button onClick={handleClear} className={btnDanger}>
                    Clear
                </button>

                <div className="ml-auto flex items-center gap-2">
                    <input
                        type="range"
                        min={100}
                        max={2000}
                        step={100}
                        value={speed}
                        onChange={e => setSpeed(Number(e.target.value))}
                        className="accent-green-500"
                    />
                    <span className="text-xs">{speed}ms</span>
                </div>
            </div>

            <div className={`${T.panel} border ${T.border} rounded-lg p-3`}>
                <div className="grid grid-cols-2 gap-4">

                    {/* LEFT → Steps */}
                    <div className="flex flex-col">
                        <div className="text-xs mb-2">Steps</div>

                        <div className="max-h-40 overflow-y-auto text-xs flex flex-col gap-1 pr-1">
                            {steps.map((s, i) => (
                                <div
                                    key={i}
                                    className={`px-2 py-1 rounded ${i === stepIndex - 1
                                        ? "bg-green-700 text-white"
                                        : "text-neutral-500"
                                        }`}
                                >
                                    {i + 1}. {s.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT → Legend + Table */}
                    <div className="flex flex-col gap-3">
                        <Legend theme={T} />
                        <DistTable algo={algo} nodes={nodes} step={currentStep} />
                    </div>

                </div>
            </div>

        </div>
    );
}