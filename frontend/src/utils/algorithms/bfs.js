import { buildAdjacency, nodeLabel } from "../graphBuilder/graph";

export function bfs(nodes, edges, startId) {
    const g = buildAdjacency(nodes, edges);

    const seen = new Set([startId]);     // nodes in queue
    const visited = new Set();           // nodes fully processed
    const queue = [startId];
    const steps = [];

    while (queue.length) {
        const node = queue.shift();

        // STEP 1: node is current (being processed)
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
            edgeStates: {},
            label: `Processing ${nodeLabel(nodes, node)} | Queue: [${queue.map(id => nodeLabel(nodes, id)).join(", ")}]`
        });

        // STEP 2: explore neighbors (no visual noise)
        for (const nei of g[node] || []) {
            if (!seen.has(nei.node)) {
                seen.add(nei.node);
                queue.push(nei.node);
            }
        }

        // STEP 3: mark node as fully visited
        visited.add(node);
    }

    return steps;
}