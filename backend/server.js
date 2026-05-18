import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import puzzleRoutes from "./routes/puzzleRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import { registerSessionSocket } from "./socket/sessionSocket.js";
import {
  cleanupExpiredSessions,
  decayPresenceState,
  listSessionRecords,
  tickActiveSessions,
} from "./services/sessionService.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5001;
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

//Enable CORS (frontend communicates with this backend)
app.use(cors());
app.use(express.json());

// Basic test route to check that the backend is running.
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Mounts all puzzle-related API routes under /api.
app.use("/api", puzzleRoutes);
app.use("/api", sessionRoutes);

registerSessionSocket(io);

setInterval(async () => {
  const changedSessions = await tickActiveSessions({
    sessions: listSessionRecords(),
  });

  for (const session of changedSessions) {
    io.to(session.id).emit("session:state", session);
  }

  const presenceSessions = decayPresenceState();

  for (const session of presenceSessions) {
    io.to(session.id).emit("session:state", session);
  }

  cleanupExpiredSessions();
}, 1000);

// Starts the HTTP and realtime server.
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
