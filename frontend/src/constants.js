export const ALGORITHMS = ["BFS", "DFS", "Dijkstra", "Kruskal", "Topological Sort"];

export const NODE_RADIUS = 20;

// ── colour helpers ──────────────────────────────────────────────────────────
export const NODE_COLORS = {
    default: { fill: "#1e3a5f", stroke: "#3b82f6", text: "#93c5fd" },
    current: { fill: "#064e3b", stroke: "#10b981", text: "#6ee7b7" },
    visited: { fill: "#78350f", stroke: "#f59e0b", text: "#fcd34d" },
    mst: { fill: "#14532d", stroke: "#22c55e", text: "#86efac" },
    queued: { fill: "#312e81", stroke: "#818cf8", text: "#c7d2fe" },
};

export const EDGE_COLORS = {
    default: "#334155",
    mst: "#22c55e",
    active: "#f59e0b",
};