import { buildAdjacency, nodeLabel } from "../graphBuilder/graph";

export function topoSort(nodes, edges) {
    const g = buildAdjacency(nodes, edges);
    const visited = new Set();
    const stack = [];
    const steps = [];

    function dfs(node) {
        visited.add(node);
        for (const nei of g[node] || []) {
            if (!visited.has(nei.node)) dfs(nei.node);
        }
        stack.push(node);
        steps.push({
            nodeStates: Object.fromEntries(
                nodes.map(n => [
                    n.id,
                    stack.includes(n.id)
                        ? n.id === node ? "current" : "visited"
                        : visited.has(n.id) ? "queued"
                            : "default",
                ])
            ),
            edgeStates: {},
            label: `Push  ${nodeLabel(nodes, node)}  →  stack: [${[...stack].map(id => nodeLabel(nodes, id)).join(", ")}]`,
        });
    }

    nodes.forEach(n => { if (!visited.has(n.id)) dfs(n.id); });

    // final order
    steps.push({
        nodeStates: Object.fromEntries(nodes.map(n => [n.id, "visited"])),
        edgeStates: {},
        label: `Topological order: ${[...stack].reverse().map(id => nodeLabel(nodes, id)).join(" → ")}`,
    });

    return steps;
}