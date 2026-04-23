import React, { useState, useEffect } from "react";
import { Save, FolderOpen, Plus } from "lucide-react";
import { BASE_URL } from "../constants";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";

function GraphManager({ nodes, edges, setNodes, setEdges, currentGraphId, setCurrentGraphId, onGraphLoaded, T }) {
    const token = localStorage.getItem("token");
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState(""); // "create" | "load" | "delete"

    const [graphs, setGraphs] = useState([]);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    // Fetch the saved-graphs list
    const fetchGraphs = async () => {
        const res = await fetch(`${BASE_URL}/graph`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setGraphs(data);
    };

    useEffect(() => {
        if (token) fetchGraphs();
    }, []);

    const deleteGraph = async (id) => {
        const confirmDelete = window.confirm("Delete this graph?");
        if (!confirmDelete) return;
        setLoading(true);
        setAction("delete");
        try {
            await fetch(`${BASE_URL}/graph/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // if currently opened graph is deleted → redirect
            if (id === currentGraphId) {
                navigate("/graph/new");
            }

            fetchGraphs();

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const createGraph = async () => {
        setLoading(true);
        setAction("create");
        try {

            const res = await fetch(`${BASE_URL}/graph`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: `Graph ${Date.now()}`,
                    nodes: [],
                    edges: []
                })
            });

            const data = await res.json();

            setNodes([]);
            setEdges([]);

            navigate(`/graph/${data._id}`);

            fetchGraphs();
        } catch (error) {
            console.log("error", error)
        } finally {
            setLoading(false);
        }
    };
    const saveGraph = async () => {

        if (!currentGraphId) return;

        await fetch(`${BASE_URL}/graph/${currentGraphId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ nodes, edges })
        });
    };

    // Load a previously saved graph
    const handleLoad = async (id) => {
        setLoading(true);
        setAction("load");
        try {


            const res = await fetch(`${BASE_URL}/graph/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();

            setNodes(data.nodes || []);
            setEdges(data.edges || []);
            setOpen(false);

            // This tells the parent to update the URL and currentGraphId
            onGraphLoaded(id);
        } catch (error) {
            console.log("error", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`flex items-center gap-2 ${T.panel} border ${T.border} rounded-lg p-2`}>

            <button
                onClick={createGraph}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded text-sm"
            >
                {loading && action === "create" ? "Creating..." : <><Plus size={14} /> New</>}
            </button>

            {/* <button
                onClick={saveGraph}
                disabled={!currentGraphId}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 rounded text-sm"
            >
                <Save size={14} />
                Save
            </button> */}

            <button
                onClick={() => { fetchGraphs(); setOpen(true); }}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-sm"
            >
                {loading && action === "load" ? "Loading..." : <><FolderOpen size={14} /> Load</>}
            </button>

            {/* Current graph indicator */}
            {currentGraphId && (
                <span className={`ml-2 text-xs ${T.subtext}`}>
                    id: {currentGraphId.slice(-6)}
                </span>
            )}

            {/* Load dialog */}
            {open && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 w-80 max-h-96 overflow-y-auto">

                        <h3 className="text-sm mb-3 text-white">Your Graphs</h3>

                        {graphs.length === 0 && (
                            <p className="text-xs text-neutral-500">No saved graphs yet.</p>
                        )}

                        {graphs.map(g => (
                            <div
                                key={g._id}
                                className={`px-3 py-2 text-sm hover:bg-neutral-800 cursor-pointer rounded flex justify-between items-center ${g._id === currentGraphId ? "text-green-400" : "text-white"}`}
                            >

                                {/* LEFT → Load */}
                                <span
                                    onClick={() => handleLoad(g._id)}
                                    className="flex-1"
                                >
                                    {g.name}
                                </span>

                                {/* RIGHT → Actions */}
                                <div className="flex items-center gap-2">

                                    {g._id === currentGraphId && (
                                        <span className="text-xs text-green-500">active</span>
                                    )}

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteGraph(g._id);
                                        }}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        {loading && action === "delete" ? "..." : <Trash2 size={14} />}
                                    </button>
                                </div>

                            </div>
                        ))}

                        <button
                            onClick={() => setOpen(false)}
                            className="mt-3 w-full py-1 bg-red-600 hover:bg-red-500 rounded text-sm text-white"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GraphManager;