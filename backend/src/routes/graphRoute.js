import express from "express";
import Graph from "../models/Graph.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// GET ALL (for GraphManager load list)
router.get("/", auth, async (req, res) => {
    try {
        const graphs = await Graph.find({ userId: req.user.id })
            .select("_id name createdAt")
            .sort({ updatedAt: -1 });

        res.json(graphs);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// CREATE
router.post("/", auth, async (req, res) => {
    try {
        const { name, nodes = [], edges = [] } = req.body;

        const graph = await Graph.create({
            userId: req.user.id,
            name: name || `Graph ${Date.now()}`,
            nodes,
            edges
        });

        res.json(graph);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// GET ONE
router.get("/:id", auth, async (req, res) => {
    try {
        const graph = await Graph.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!graph) return res.status(404).json({ msg: "Graph not found" });

        res.json(graph);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// UPDATE (auto-save)
router.put("/:id", auth, async (req, res) => {
    try {
        const { nodes, edges, name } = req.body;

        const graph = await Graph.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { nodes, edges, ...(name && { name }) },
            { new: true }
        );

        if (!graph) return res.status(404).json({ msg: "Graph not found" });

        res.json(graph);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// DELETE
router.delete("/:id", auth, async (req, res) => {
    try {
        await Graph.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        res.json({ msg: "Deleted" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

export default router;