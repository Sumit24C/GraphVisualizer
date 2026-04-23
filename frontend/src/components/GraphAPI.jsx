// components/GraphAPI.jsx
import React, { useState } from "react";
import { Save, Download } from "lucide-react";
import { BASE_URL } from "../constants";

function GraphAPI({ nodes, edges, setNodes, setEdges, T }) {
    const [msg, setMsg] = useState("");

    const token = localStorage.getItem("token");

    const handleSave = async () => {
        setMsg("");

        try {
            const res = await fetch(`${BASE_URL}/graph/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ nodes, edges })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || "Save failed");

            setMsg("Graph saved");

        } catch (err) {
            setMsg(err.message);
        }
    };

    const handleFetch = async () => {
        setMsg("");

        try {
            const res = await fetch(`${BASE_URL}/graph`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || "Fetch failed");

            setNodes(data.nodes || []);
            setEdges(data.edges || []);

            setMsg("Graph loaded");

        } catch (err) {
            setMsg(err.message);
        }
    };

    return (
        <div className={`flex items-center gap-2 ${T.panel} border ${T.border} rounded-lg p-2`}>

            {/* Save */}
            <button
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
            >
                <Save size={14} />
                Save
            </button>

            {/* Load */}
            <button
                onClick={handleFetch}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
            >
                <Download size={14} />
                Load
            </button>

            {msg && (
                <span className="text-xs text-neutral-400 ml-2">
                    {msg}
                </span>
            )}
        </div>
    );
}

export default GraphAPI;