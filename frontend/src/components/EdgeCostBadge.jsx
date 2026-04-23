import { EDGE_COLORS } from "../constants";

export default function EdgeCostBadge({ edges, edgeStates }) {
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