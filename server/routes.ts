import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { insertGroceryItemSchema, insertVendorSchema, insertProfileSchema, insertOrderSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Profiles
  app.get("/api/profile", async (_req, res) => {
    const profile = await storage.getProfile();
    res.json(profile || null);
  });

  app.get("/api/all-profiles", async (_req, res) => {
    const profiles = await storage.getAllProfiles();
    res.json(profiles);
  });

  app.post("/api/profile", async (req, res) => {
    const parsed = insertProfileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const profile = await storage.createProfile(parsed.data);
    res.status(201).json(profile);
  });

  // Grocery Items
  app.get("/api/items", async (req, res) => {
    const vendorId = req.query.vendorId as string | undefined;
    const items = await storage.getGroceryItems(vendorId);
    res.json(items);
  });

  app.post("/api/items", async (req, res) => {
    const { vendorIds, ...itemData } = req.body;

    if (Array.isArray(vendorIds)) {
      const createdItems = [];
      for (const vId of vendorIds) {
        const item = await storage.createGroceryItem({ ...itemData, vendorId: vId });
        createdItems.push(item);
      }
      return res.status(201).json(createdItems);
    }

    const parsed = insertGroceryItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const item = await storage.createGroceryItem(parsed.data);
    res.status(201).json(item);
  });

  app.patch("/api/items/:id", async (req, res) => {
    const item = await storage.updateGroceryItem(req.params.id, req.body);
    res.json(item);
  });

  app.delete("/api/items/:id", async (req, res) => {
    await storage.deleteGroceryItem(req.params.id);
    res.status(204).end();
  });

  // Vendors
  app.get("/api/vendors", async (_req, res) => {
    const vendors = await storage.getVendors();
    res.json(vendors);
  });

  app.post("/api/vendors", async (req, res) => {
    const parsed = insertVendorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const vendor = await storage.createVendor(parsed.data);
    res.status(201).json(vendor);
  });

  app.delete("/api/vendors/:id", async (req, res) => {
    await storage.deleteVendor(req.params.id);
    res.status(204).end();
  });

  // Orders / Transactions
  app.get("/api/orders", async (_req, res) => {
    const orders = await storage.getOrders();
    res.json(orders);
  });

  app.post("/api/orders", async (req, res) => {
    const parsed = insertOrderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const order = await storage.createOrder(parsed.data);
    res.status(201).json(order);
  });

  const httpServer = createServer(app);
  return httpServer;
}
