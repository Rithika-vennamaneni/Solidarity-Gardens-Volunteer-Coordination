import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
}

export class MemStorage implements IStorage {
  constructor() {
  }
}

export const storage = new MemStorage();
