export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const ALGORITHMS = ["BFS", "DFS", "Dijkstra", "Bellman-Ford", "Kruskal"];

export const NODE_RADIUS = 20;

// ── colour helpers ──────────────────────────────────────────────────────────
export const NODE_COLORS = {
    // idle nodes (clean blue glow)
    default: {
        fill: "#0f172a",      // deep navy
        stroke: "#3b82f6",    // bright blue
        text: "#bfdbfe"       // soft light blue
    },

    // currently processing node (teal highlight)
    current: {
        fill: "#022c22",
        stroke: "#14b8a6",    // teal
        text: "#5eead4"
    },

    // visited / processed (warm amber)
    visited: {
        fill: "#451a03",
        stroke: "#f59e0b",
        text: "#fde68a"
    },

    // MST / final edges nodes (green success)
    mst: {
        fill: "#052e16",
        stroke: "#22c55e",
        text: "#bbf7d0"
    },

    // queued / updated (violet accent)
    queued: {
        fill: "#1e1b4b",
        stroke: "#8b5cf6",
        text: "#c4b5fd"
    },
};

export const EDGE_COLORS = {
    default: "#64748b",   // brighter slate (not faded anymore)
    mst: "#22c55e",       // green
    active: "#f59e0b",    // orange
};