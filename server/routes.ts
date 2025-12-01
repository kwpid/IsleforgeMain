import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  app.get("/api/game/:id", async (req, res) => {
    const { id } = req.params;
    const state = await storage.getGameState(id);
    if (!state) {
      return res.status(404).json({ error: "Game not found" });
    }
    res.json(state);
  });

  app.post("/api/game/:id", async (req, res) => {
    const { id } = req.params;
    const state = req.body;
    await storage.saveGameState(id, state);
    res.json({ success: true });
  });

  return httpServer;
}
