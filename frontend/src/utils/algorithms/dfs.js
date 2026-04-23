import { buildAdjacency, nodeLabel } from "../graphBuilder/graph";

export function dfs(nodes, edges, startId) {
    const g = buildAdjacency(nodes, edges);

    const visited = new Set();
    const steps = [];

    function helper(node, parent = null) {
        // STEP 1: entering node (current)
        steps.push({
            nodeStates: Object.fromEntries(
                nodes.map(n => [
                    n.id,
                    n.id === node
                        ? "current"
                        : visited.has(n.id)
                            ? "visited"
                            : "default"
                ])
            ),
            edgeStates: Object.fromEntries(
                edges.map(e => [
                    e.id,
                    (parent !== null && e.from === parent && e.to === node)
                        ? "active"
                        : "default"
                ])
            ),
            label: parent === null
                ? `Start DFS at ${nodeLabel(nodes, node)}`
                : `Move from ${nodeLabel(nodes, parent)} → ${nodeLabel(nodes, node)}`
        });

        visited.add(node);

        // STEP 2: explore neighbors
        for (const nei of g[node] || []) {
            if (!visited.has(nei.node)) {
                helper(nei.node, node);
            }
        }

        // STEP 3: backtrack (mark fully processed)
        steps.push({
            nodeStates: Object.fromEntries(
                nodes.map(n => [
                    n.id,
                    visited.has(n.id) ? "visited" : "default"
                ])
            ),
            edgeStates: {},
            label: `Backtrack from ${nodeLabel(nodes, node)}`
        });
    }

    helper(startId);
    return steps;
}