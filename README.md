# Graph Visualizer

A modern, interactive graph algorithm visualizer built with React.
This tool allows users to create, edit, and simulate graph algorithms with step-by-step execution and animation.

---

## Features

### Graph Editor

* Add, edit, and delete nodes
* Add, edit, and delete edges
* Drag nodes to reposition
* Double-click to create edges interactively
* Supports weighted and negative edges

### Algorithms

* Breadth-First Search (BFS)
* Depth-First Search (DFS)
* Dijkstra's Algorithm
* Bellman-Ford Algorithm
* Kruskal’s Algorithm
* Topological Sort

### Visualization

* Step-by-step execution
* Play, pause, next, and previous controls
* Adjustable animation speed
* Debug-style step tracking
* Node and edge state highlighting

### Data Handling

* Graph auto-saved using localStorage
* JSON import support for graph creation

### UI

* Clean minimal interface
* Dark and light theme support

---

## Tech Stack

Frontend: React, Canvas API, tailwindcss
Storage: localStorage

---

## Installation

```bash
git clone https://github.com/your-username/graph-visualizer.git
cd graph-visualizer
npm install
npm run dev
```

---

## Project Structure

```plaintext
src/
│
├── assets/
│
├── components/
│   ├── CustomButton.jsx
│   ├── DistTable.jsx
│   └── EdgeCostBadge.jsx
│
├── pages/
│   └── GraphVisualizer.jsx
│
├── utils/
│   ├── algorithms/
│   │   ├── bellmanFord.js
│   │   ├── bfs.js
│   │   ├── dfs.js
│   │   ├── dijkstra.js
│   │   ├── kruskal.js
│   │   ├── topoSort.js
│   │   └── index.js
│   │
│   └── graphBuilder/
│       └── graph.js
│
├── App.jsx
├── App.css
├── constants.js
├── index.css
├── main.jsx
├── Theme.jsx
│
├── .gitignore
└── eslint.config.js
```

---

## Usage

### Create Graph

* Add nodes manually or click on canvas
* Add edges using dropdown or double-click interaction
* Assign weights (including negative values)

### Run Algorithm

1. Select algorithm
2. Select start node (if required)
3. Click "Run"

### Control Execution

* Play / Pause animation
* Step forward and backward
* Adjust speed

### Analyze Output

* View node states (current, visited)
* Observe edge transitions
* Check shortest path and distances

---

## JSON Import Format

```json
{
  "nodes": [
    { "id": 1, "label": "1", "x": 100, "y": 100 }
  ],
  "edges": [
    { "id": 1, "from": 1, "to": 2, "weight": 5 }
  ]
}
```

---

## Algorithm Notes

BFS and DFS:

* Traversal algorithms
* Do not consider weights

Dijkstra:

* Finds shortest path
* Does not support negative weights

Bellman-Ford:

* Supports negative weights
* Detects negative cycles

Kruskal:

* Computes Minimum Spanning Tree

Topological Sort:

* Works on Directed Acyclic Graphs (DAG)

---

## Theme System

The application uses a centralized theme configuration:

* Dark mode: black background with green accents
* Light mode: white background with green accents
* No excessive color usage for clarity

---

## Known Limitations

* Native select dropdown styling depends on browser
* No backend persistence (only localStorage)
  
---

## Future Improvements

* Custom dropdown components
* Graph export (PNG/SVG)
* Multi-graph workspace
* Backend integration
* Keyboard shortcuts
* Graph minimap

---

## Summary

This project provides a structured and interactive way to understand graph algorithms through visualization and step-by-step execution.
