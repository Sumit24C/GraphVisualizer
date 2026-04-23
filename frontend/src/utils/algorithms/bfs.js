import { buildAdjacency, nodeLabel } from "../graphBuilder/graph";

export function bfs(nodes, edges, startId) {
    const g = buildAdjacency(nodes, edges);

    const seen = new Set([startId]);
    const visited = new Set();
    const queue = [startId];
    const steps = [];

    // helper: build edge states based on visited nodes
    const buildEdgeStates = () => {
        const states = {};

        edges.forEach(e => {
            if (visited.has(e.from) && visited.has(e.to)) {
                states[e.id] = "visited"; // same color as node
            }
        });

        return states;
    };

    while (queue.length) {
        const node = queue.shift();

        // STEP 1: processing node
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
            edgeStates: buildEdgeStates(),
            label: `Processing ${nodeLabel(nodes, node)} | Queue: [${queue.map(id => nodeLabel(nodes, id)).join(", ")}]`
        });

        // STEP 2: explore neighbors
        for (const nei of g[node] || []) {
            if (!seen.has(nei.node)) {
                seen.add(nei.node);
                queue.push(nei.node);
            }
        }

        // STEP 3: mark visited
        visited.add(node);

        // STEP 4: update edges after visit
        steps.push({
            nodeStates: Object.fromEntries(
                nodes.map(n => [
                    n.id,
                    visited.has(n.id) ? "visited" : "default"
                ])
            ),
            edgeStates: buildEdgeStates(),
            label: `${nodeLabel(nodes, node)} marked as visited`
        });
    }

    return steps;
}