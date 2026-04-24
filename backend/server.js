import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import puzzleRoutes from "./routes/puzzleRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Basic test route to check that the backend is running.
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Mounts all puzzle-related API routes under /api.
app.use("/api", puzzleRoutes);

// Starts the Express server.
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
