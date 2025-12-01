import { randomUUID } from "crypto";

export interface IStorage {
  getGameState(id: string): Promise<Record<string, unknown> | undefined>;
  saveGameState(id: string, state: Record<string, unknown>): Promise<void>;
}

export class MemStorage implements IStorage {
  private gameStates: Map<string, Record<string, unknown>>;

  constructor() {
    this.gameStates = new Map();
  }

  async getGameState(id: string): Promise<Record<string, unknown> | undefined> {
    return this.gameStates.get(id);
  }

  async saveGameState(id: string, state: Record<string, unknown>): Promise<void> {
    this.gameStates.set(id, state);
  }
}

export const storage = new MemStorage();
