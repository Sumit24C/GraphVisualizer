import { NODE_COLORS, NODE_RADIUS, EDGE_COLORS } from "../../constants";

export function buildAdjacency(nodes, edges) {
    const g = {};
    nodes.forEach(n => (g[n.id] = []));
    edges.forEach(e => {
        if (g[e.from] !== undefined)
            g[e.from].push({ node: e.to, weight: e.weight });
    });
    return g;
}

// utils/graphStates.js

export function buildNodeStates(nodes, dist, getState) {
    return Object.fromEntries(
        nodes.map(n => [
            n.id,
            {
                state: getState(n.id),
                dist: dist[n.id],
            },
        ])
    );
}

export function buildEdgeState(edges, from, to) {
    return Object.fromEntries(
        edges.map(e => [
            e.id,
            (e.from === from && e.to === to) ? "active" : "default"
        ])
    );
}

export function highlightShortestPath(edges, parent) {
    const result = {};

    for (const node in parent) {
        if (parent[node] !== null) {
            const p = parent[node];
            const edge = edges.find(e => e.from == p && e.to == node);
            if (edge) result[edge.id] = "mst";
        }
    }

    return result;
}

export function nodeLabel(nodes, id) {
    return nodes.find(n => n.id === id)?.label ?? String(id);
}

export function drawGraph(
    canvas,
    nodes,
    edges,
    nodeStates = {},
    edgeStates = {},
    selectedNode = null,
    selectedEdge = null
) {
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    if (!W || !H) return;

    canvas.width = W * dpr;
    canvas.height = H * dpr;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // ─────────────────────────────────────────
    // EDGES
    // ─────────────────────────────────────────
    edges.forEach(e => {
        const from = nodes.find(n => n.id === e.from);
        const to = nodes.find(n => n.id === e.to);
        if (!from || !to) return;

        const rawState = edgeStates[e.id] ?? "default";
        const isSelected = e.id === selectedEdge;

        const color = EDGE_COLORS[rawState] ?? EDGE_COLORS.default;

        // thicker lines
        const lw = isSelected ? 5 : (rawState !== "default" ? 3 : 2);

        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const sx = from.x + NODE_RADIUS * Math.cos(angle);
        const sy = from.y + NODE_RADIUS * Math.sin(angle);
        const ex = to.x - NODE_RADIUS * Math.cos(angle);
        const ey = to.y - NODE_RADIUS * Math.sin(angle);

        ctx.save();

        ctx.strokeStyle = color;
        ctx.lineWidth = lw;

        // ❌ no glow
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // arrow head
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 10 * Math.cos(angle - 0.35), ey - 10 * Math.sin(angle - 0.35));
        ctx.lineTo(ex - 10 * Math.cos(angle + 0.35), ey - 10 * Math.sin(angle + 0.35));
        ctx.closePath();
        ctx.fill();

        // ── weight label (FIXED STYLE, NO STATE CHANGE) ──
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;

        const wText = String(e.weight);
        ctx.font = "bold 11px monospace";

        const tw = ctx.measureText(wText).width;
        const pw = tw + 8, ph = 14;

        // fixed background
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.roundRect(mx - pw / 2 + 6, my - ph / 2 - 6, pw, ph, 4);
        ctx.fill();

        // fixed text color
        ctx.fillStyle = "#f1f5f9";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(wText, mx + 6, my - 6);

        ctx.restore();
    });

    // ─────────────────────────────────────────
    // NODES
    // ─────────────────────────────────────────
    nodes.forEach(n => {
        const raw = nodeStates[n.id];

        const stateKey =
            typeof raw === "object"
                ? (raw?.state ?? "default")
                : (raw ?? "default");

        const extra = typeof raw === "object" ? raw : null;

        const col = NODE_COLORS[stateKey] ?? NODE_COLORS.default;

        const isSelected = n.id === selectedNode;

        ctx.save();

        // ❌ no glow
        ctx.shadowBlur = 0;

        // circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = col.fill;
        ctx.fill();

        ctx.strokeStyle = col.stroke;

        // thicker border
        ctx.lineWidth = isSelected ? 5 : 3;
        ctx.stroke();

        // label
        ctx.fillStyle = col.text;
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const hasExtra = extra && (extra.dist !== undefined || extra.cost !== undefined);

        ctx.fillText(n.label, n.x, hasExtra ? n.y - 5 : n.y);

        // distance / cost
        if (hasExtra) {
            const val = extra.dist !== undefined ? extra.dist : extra.cost;
            const txt = val === Infinity ? "∞" : String(val);

            ctx.font = "10px monospace";
            ctx.fillStyle = col.stroke;
            ctx.fillText(txt, n.x, n.y + 7);
        }

        ctx.restore();
    });
}