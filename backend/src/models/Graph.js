import mongoose from "mongoose";

const graphSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: {
        type: String,
        required: true
    },
    nodes: [
        {
            id: Number,
            label: String,
            x: Number,
            y: Number
        }
    ],

    edges: [
        {
            id: Number,
            from: Number,
            to: Number,
            weight: Number
        }
    ]
}, { timestamps: true });

export default mongoose.model("Graph", graphSchema);