import { buildAdjacency, nodeLabel, buildNodeStates, buildEdgeState, highlightShortestPath } from "../graphBuilder/graph";

export function bellmanFord(nodes, edges, startId) {
    const dist = {};
    const parent = {};
    const steps = [];

    nodes.forEach(n => {
        dist[n.id] = Infinity;
        parent[n.id] = null;
    });

    dist[startId] = 0;

    // RELAX EDGES (V-1 TIMES)
    for (let i = 0; i < nodes.length - 1; i++) {
        let updated = false;

        for (const e of edges) {
            const { from, to, weight } = e;

            if (dist[from] !== Infinity && dist[from] + weight < dist[to]) {
                dist[to] = dist[from] + weight;
                parent[to] = from;
                updated = true;

                steps.push({
                    nodeStates: buildNodeStates(nodes, dist, (id) =>
                        id === to ? "current" :
                        id === from ? "visited" :
                        dist[id] !== Infinity ? "visited" : "default"
                    ),
                    edgeStates: buildEdgeState(edges, from, to),
                    label: `Relax ${nodeLabel(nodes, from)} → ${nodeLabel(nodes, to)} | dist=${dist[to]}`
                });
            }
        }

        if (!updated) break;
    }

    // NEGATIVE CYCLE CHECK
    let hasNegativeCycle = false;

    for (const e of edges) {
        const { from, to, weight } = e;

        if (dist[from] !== Infinity && dist[from] + weight < dist[to]) {
            hasNegativeCycle = true;

            steps.push({
                nodeStates: buildNodeStates(nodes, dist, (id) =>
                    id === to ? "current" : "visited"
                ),
                edgeStates: buildEdgeState(edges, from, to),
                label: `⚠ Negative cycle detected via ${nodeLabel(nodes, from)} → ${nodeLabel(nodes, to)}`
            });

            break;
        }
    }

    // FINAL STEP
    steps.push({
        nodeStates: buildNodeStates(nodes, dist, (id) =>
            dist[id] !== Infinity ? "visited" : "default"
        ),
        edgeStates: hasNegativeCycle ? {} : highlightShortestPath(edges, parent),
        label: hasNegativeCycle
            ? "Negative cycle exists — shortest paths invalid"
            : `Final distances: ${nodes.map(n =>
                `${nodeLabel(nodes, n.id)}=${dist[n.id] === Infinity ? "∞" : dist[n.id]}`
            ).join(", ")}`
    });

    return steps;
}