import { buildAdjacency, nodeLabel } from "../graphBuilder/graph";

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

        // STEP: select node
        steps.push({
            nodeStates: buildNodeStates(nodes, visited, u, dist),
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
                    nodeStates: buildNodeStates(nodes, visited, nei.node, dist),
                    edgeStates: buildEdgeState(edges, u, nei.node),
                    label: `Relax ${nodeLabel(nodes, u)} → ${nodeLabel(nodes, nei.node)} | dist=${newDist}`
                });
            }
        }

        // finalize
        steps.push({
            nodeStates: buildNodeStates(nodes, visited, null, dist),
            edgeStates: {},
            label: `Finalize ${nodeLabel(nodes, u)}`
        });
    }

    // 🔥 FINAL STEP: show shortest paths
    steps.push({
        nodeStates: buildNodeStates(nodes, visited, null, dist),
        edgeStates: highlightShortestPath(edges, parent),
        label: `Final distances: ${nodes.map(n =>
            `${nodeLabel(nodes, n.id)}=${dist[n.id] === Infinity ? "∞" : dist[n.id]}`
        ).join(", ")}`
    });

    return steps;
}


// helpers
function buildNodeStates(nodes, visited, current, dist) {
    return Object.fromEntries(
        nodes.map(n => [
            n.id,
            {
                state:
                    n.id === current
                        ? "current"
                        : visited.has(n.id)
                            ? "visited"
                            : "default",
                dist: dist[n.id]
            }
        ])
    );
}

function buildEdgeState(edges, from, to) {
    return Object.fromEntries(
        edges.map(e => [
            e.id,
            (e.from === from && e.to === to) ? "active" : "default"
        ])
    );
}

function highlightShortestPath(edges, parent) {
    const result = {};

    for (const node in parent) {
        if (parent[node] !== null) {
            const p = parent[node];

            const edge = edges.find(e => e.from == p && e.to == node);
            if (edge) result[edge.id] = "mst";
        }
    }

    return result;
}