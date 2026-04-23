import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import cors from "cors";

import authRoutes from "./routes/authRoute.js";
import graphRoutes from "./routes/graphRoute.js";
import { DB_NAME } from "./constant.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/graph", graphRoutes);
const PORT = process.env.PORT || 8000;

mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
    .then(() => {
        console.log("DB connected");
        app.listen(PORT, () => console.log(`Server running on ${PORT}`));
    })
    .catch(err => console.error(err));