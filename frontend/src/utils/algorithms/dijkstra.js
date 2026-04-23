import { buildAdjacency, nodeLabel, buildNodeStates, buildEdgeState, highlightShortestPath } from "../graphBuilder/graph";

export function dijkstra(nodes, edges, startId) {
    const g = buildAdjacency(nodes, edges);

    const dist = {};
    const parent = {};
    const visited = new Set();
    const steps = [];

    nodes.forEach(n => {
        dist[n.id] = Infinity;
        parent[n.id] = null;
    });

    dist[startId] = 0;

    for (let i = 0; i < nodes.length; i++) {
        let u = null;

        for (const n of nodes) {
            if (!visited.has(n.id) && (u === null || dist[n.id] < dist[u])) {
                u = n.id;
            }
        }

        if (u === null || dist[u] === Infinity) break;

        // SELECT
        steps.push({
            nodeStates: buildNodeStates(nodes, dist, (id) =>
                id === u ? "current" :
                visited.has(id) ? "visited" : "default"
            ),
            edgeStates: {},
            label: `Select ${nodeLabel(nodes, u)} (dist=${dist[u]})`
        });

        visited.add(u);

        // RELAX
        for (const nei of g[u] || []) {
            const newDist = dist[u] + nei.weight;

            if (newDist < dist[nei.node]) {
                dist[nei.node] = newDist;
                parent[nei.node] = u;

                steps.push({
                    nodeStates: buildNodeStates(nodes, dist, (id) =>
                        id === nei.node ? "current" :
                        visited.has(id) ? "visited" : "default"
                    ),
                    edgeStates: buildEdgeState(edges, u, nei.node),
                    label: `Relax ${nodeLabel(nodes, u)} → ${nodeLabel(nodes, nei.node)} | dist=${newDist}`
                });
            }
        }

        // FINALIZE NODE
        steps.push({
            nodeStates: buildNodeStates(nodes, dist, (id) =>
                visited.has(id) ? "visited" : "default"
            ),
            edgeStates: {},
            label: `Finalize ${nodeLabel(nodes, u)}`
        });
    }

    // FINAL RESULT
    steps.push({
        nodeStates: buildNodeStates(nodes, dist, (id) =>
            dist[id] !== Infinity ? "visited" : "default"
        ),
        edgeStates: highlightShortestPath(edges, parent),
        label: `Final distances: ${nodes.map(n =>
            `${nodeLabel(nodes, n.id)}=${dist[n.id] === Infinity ? "∞" : dist[n.id]}`
        ).join(", ")}`
    });

    return steps;
}