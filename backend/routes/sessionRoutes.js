import express from "express";
import {
  createSession,
  getSessionById,
  joinSession,
  restoreSessionPlayer,
} from "../services/sessionService.js";
import { normalizeIntensity } from "../data/intensity.js";

const router = express.Router();

const normalizePlayerName = (value) => value?.trim().slice(0, 24);

router.post("/sessions", (req, res) => {
  const playerName = normalizePlayerName(req.body?.playerName);

  if (!playerName) {
    res.status(400).json({
      error: "Player name is required.",
    });
    return;
  }

  const result = createSession({
    playerName,
    intensity: normalizeIntensity(req.body?.intensity),
  });
  res.status(201).json(result);
});

router.post("/sessions/join", (req, res) => {
  const playerName = normalizePlayerName(req.body?.playerName);
  const joinCode = req.body?.joinCode?.trim().toUpperCase();

  if (!playerName || !joinCode) {
    res.status(400).json({
      error: "Player name and join code are required.",
    });
    return;
  }

  const result = joinSession({ joinCode, playerName });

  if (!result) {
    res.status(404).json({
      error: "Session not found.",
    });
    return;
  }

  res.json(result);
});

router.post("/sessions/restore", (req, res) => {
  const sessionId = req.body?.sessionId?.trim();
  const recoveryToken = req.body?.recoveryToken?.trim();

  if (!sessionId || !recoveryToken) {
    res.status(400).json({
      error: "Session id and recovery token are required.",
    });
    return;
  }

  const result = restoreSessionPlayer({
    sessionId,
    recoveryToken,
  });

  if (!result) {
    res.status(404).json({
      error: "Stored session could not be restored.",
    });
    return;
  }

  res.json(result);
});

router.get("/sessions/:sessionId", (req, res) => {
  const session = getSessionById(req.params.sessionId);

  if (!session) {
    res.status(404).json({
      error: "Session not found.",
    });
    return;
  }

  res.json(session);
});

export default router;
