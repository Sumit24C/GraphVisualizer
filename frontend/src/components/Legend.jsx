// components/Legend.jsx

import { NODE_COLORS, EDGE_COLORS } from "../constants";

export default function Legend({ theme }) {
    const T = theme;

    const nodeItems = [
        { key: "default", label: "Unvisited Node" },
        { key: "current", label: "Current Node" },
        { key: "visited", label: "Visited Node" },
        { key: "mst", label: "Tree / MST Node" },
    ];

    const edgeItems = [
        { key: "default", label: "Normal Edge" },
        { key: "active", label: "Currently Exploring" },
        { key: "mst", label: "Selected / Tree Edge" },
    ];

    return (
        <div className={`${T.panel} border ${T.border} rounded-lg p-3 text-xs`}>
            <div className="mb-2 font-semibold">Legend</div>

            {/* Nodes */}
            <div className="mb-2">
                <div className="mb-1 text-neutral-400">Nodes</div>
                {nodeItems.map(n => (
                    <div key={n.key} className="flex items-center gap-2 mb-1">
                        <div
                            className="w-4 h-4 rounded-full border"
                            style={{
                                background: NODE_COLORS[n.key]?.fill,
                                borderColor: NODE_COLORS[n.key]?.stroke
                            }}
                        />
                        <span>{n.label}</span>
                    </div>
                ))}
            </div>

            {/* Edges */}
            <div>
                <div className="mb-1 text-neutral-400">Edges</div>
                {edgeItems.map(e => (
                    <div key={e.key} className="flex items-center gap-2 mb-1">
                        <div
                            className="w-6 h-[2px]"
                            style={{ background: EDGE_COLORS[e.key] }}
                        />
                        <span>{e.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}