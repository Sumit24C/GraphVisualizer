import React from "react";

function StatsBar({ nodes, edges, steps, stepIndex, T }) {
    return (
        <div className={`flex items-center gap-3 px-4 py-2 ${T.panel} border ${T.border} rounded-lg text-xs`}>

            <span className={`${T.subtext}`}>
                {nodes.length} nodes
            </span>

            <span className={`${T.subtext}`}>
                {edges.length} edges
            </span>

            {steps.length > 0 && (
                <span className={`${T.accent}`}>
                    Step {stepIndex}/{steps.length}
                </span>
            )}
        </div>
    );
}

export default StatsBar;