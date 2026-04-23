import { NODE_COLORS } from "../constants";

export default function DistTable({ algo, nodes, step }) {
    if (!step || !["Dijkstra", "Bellman-Ford", "Kruskal"].includes(algo)) return null;

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
