import { nodeLabel } from "../graphBuilder/graph";

export function kruskal(nodes, edges) {
    const parent = {};
    nodes.forEach(n => (parent[n.id] = n.id));

    const find = x => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const union = (a, b) => { parent[find(a)] = find(b); };

    const sorted = [...edges].sort((a, b) => a.weight - b.weight);
    const mstEdgeIds = new Set();
    const mstNodes = new Set();
    const steps = [];
    let totalCost = 0;

    // STEP 0: show sorted order
    steps.push({
        nodeStates: Object.fromEntries(nodes.map(n => [n.id, { state: "default", cost: 0 }])),
        edgeStates: Object.fromEntries(edges.map(e => [e.id, "default"])),
        label: `Sorted edges: ${sorted.map(e =>
            `${nodeLabel(nodes, e.from)}→${nodeLabel(nodes, e.to)}(${e.weight})`
        ).join("  ·  ")}`,
    });

    for (const e of sorted) {
        const skip = find(e.from) === find(e.to);

        // STEP: considering this edge
        steps.push({
            nodeStates: mkNodeStates(nodes, mstNodes, null, totalCost),
            edgeStates: {
                ...Object.fromEntries([...mstEdgeIds].map(id => [id, "mst"])),
                [e.id]: "active",
            },
            label: `Consider  ${nodeLabel(nodes, e.from)} → ${nodeLabel(nodes, e.to)}  (w = ${e.weight})  ${skip ? "→ skip (cycle)" : "→ add to MST"}`,
        });

        if (!skip) {
            union(e.from, e.to);
            mstEdgeIds.add(e.id);
            mstNodes.add(e.from);
            mstNodes.add(e.to);
            totalCost += e.weight;

            steps.push({
                nodeStates: mkNodeStates(nodes, mstNodes, e.from, totalCost, e.to),
                edgeStates: Object.fromEntries([...mstEdgeIds].map(id => [id, id === e.id ? "active" : "mst"])),
                label: `Added  ${nodeLabel(nodes, e.from)} → ${nodeLabel(nodes, e.to)}  (w = ${e.weight})  |  MST cost so far = ${totalCost}`,
            });
        }
    }

    // FINAL
    steps.push({
        nodeStates: mkNodeStates(nodes, mstNodes, null, totalCost),
        edgeStates: Object.fromEntries([...mstEdgeIds].map(id => [id, "mst"])),
        label: `MST complete  |  total cost = ${totalCost}`,
    });

    return steps;
}

function mkNodeStates(nodes, mstNodes, current, totalCost, secondary = null) {
    return Object.fromEntries(
        nodes.map(n => [
            n.id,
            {
                state:
                    n.id === current ? "current"
                        : n.id === secondary ? "current"
                            : mstNodes.has(n.id) ? "mst"
                                : "default",
                cost: mstNodes.has(n.id) ? totalCost : undefined,
            },
        ])
    );
}