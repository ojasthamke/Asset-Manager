// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "node:http";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopName: text("shop_name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  gst: text("gst"),
  // Optional
  turnover: text("turnover").notNull(),
  role: text("role").notNull(),
  // 'shop_owner' or 'agency'
  language: text("language").notNull()
});
var vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  isSpecial: boolean("is_special").notNull().default(false)
});
var groceryItems = pgTable("grocery_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: text("vendor_id").notNull(),
  // Can be vendor UUID or 'common'
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  imageKey: text("image_key"),
  selected: boolean("selected").notNull().default(false),
  quantity: integer("quantity").notNull().default(1)
});
var orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id).notNull(),
  profileId: varchar("profile_id").references(() => profiles.id),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  itemsCount: integer("items_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertProfileSchema = createInsertSchema(profiles);
var insertGroceryItemSchema = createInsertSchema(groceryItems).extend({
  price: z.string().or(z.number())
});
var insertVendorSchema = createInsertSchema(vendors);
var insertOrderSchema = createInsertSchema(orders);

// server/storage.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, or } from "drizzle-orm";
import pg from "pg";
import * as dotenv from "dotenv";
dotenv.config();
var { Pool } = pg;
var DatabaseStorage = class {
  db;
  constructor(connectionString) {
    const pool = new Pool({ connectionString });
    this.db = drizzle(pool);
  }
  async getUser(id) {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await this.db.insert(users).values(insertUser).returning();
    return user;
  }
  async getProfile() {
    const [profile] = await this.db.select().from(profiles).limit(1);
    return profile;
  }
  async getAllProfiles() {
    return await this.db.select().from(profiles);
  }
  async createProfile(insertProfile) {
    const [profile] = await this.db.insert(profiles).values(insertProfile).returning();
    return profile;
  }
  async getGroceryItems(vendorId) {
    if (vendorId) {
      return await this.db.select().from(groceryItems).where(
        or(eq(groceryItems.vendorId, vendorId), eq(groceryItems.vendorId, "common"))
      );
    }
    return await this.db.select().from(groceryItems);
  }
  async createGroceryItem(insertItem) {
    const [item] = await this.db.insert(groceryItems).values({ ...insertItem, price: insertItem.price.toString() }).returning();
    return item;
  }
  async updateGroceryItem(id, update) {
    const values = { ...update };
    if (update.price !== void 0) values.price = update.price.toString();
    const [item] = await this.db.update(groceryItems).set(values).where(eq(groceryItems.id, id)).returning();
    return item;
  }
  async deleteGroceryItem(id) {
    await this.db.delete(groceryItems).where(eq(groceryItems.id, id));
  }
  async getVendors() {
    return await this.db.select().from(vendors);
  }
  async createVendor(insertVendor) {
    const [vendor] = await this.db.insert(vendors).values(insertVendor).returning();
    return vendor;
  }
  async updateVendor(id, update) {
    const [vendor] = await this.db.update(vendors).set(update).where(eq(vendors.id, id)).returning();
    return vendor;
  }
  async deleteVendor(id) {
    await this.db.delete(orders).where(eq(orders.vendorId, id));
    await this.db.delete(groceryItems).where(eq(groceryItems.vendorId, id));
    await this.db.delete(vendors).where(eq(vendors.id, id));
  }
  async getOrders() {
    return await this.db.select().from(orders);
  }
  async createOrder(insertOrder) {
    const [order] = await this.db.insert(orders).values({ ...insertOrder, totalAmount: insertOrder.totalAmount.toString() }).returning();
    return order;
  }
};
var MemStorage = class {
  users = /* @__PURE__ */ new Map();
  groceryItems = /* @__PURE__ */ new Map();
  vendors = /* @__PURE__ */ new Map();
  profiles = /* @__PURE__ */ new Map();
  orders = /* @__PURE__ */ new Map();
  currentId = 1;
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find((u) => u.username === username);
  }
  async createUser(u) {
    const id = (this.currentId++).toString();
    const user = { ...u, id };
    this.users.set(id, user);
    return user;
  }
  async getProfile() {
    return Array.from(this.profiles.values())[0];
  }
  async getAllProfiles() {
    return Array.from(this.profiles.values());
  }
  async createProfile(p) {
    const id = (this.currentId++).toString();
    const profile = { ...p, id };
    this.profiles.set(id, profile);
    return profile;
  }
  async getGroceryItems(vendorId) {
    const items = Array.from(this.groceryItems.values());
    return vendorId ? items.filter((i) => i.vendorId === vendorId || i.vendorId === "common") : items;
  }
  async createGroceryItem(i) {
    const id = (this.currentId++).toString();
    const item = { ...i, id, price: i.price.toString() };
    this.groceryItems.set(id, item);
    return item;
  }
  async updateGroceryItem(id, u) {
    const item = this.groceryItems.get(id);
    if (!item) throw new Error("Item not found");
    const updated = { ...item, ...u };
    if (u.price) updated.price = u.price.toString();
    this.groceryItems.set(id, updated);
    return updated;
  }
  async deleteGroceryItem(id) {
    this.groceryItems.delete(id);
  }
  async getVendors() {
    return Array.from(this.vendors.values());
  }
  async createVendor(v) {
    const id = (this.currentId++).toString();
    const vendor = { ...v, id };
    this.vendors.set(id, vendor);
    return vendor;
  }
  async updateVendor(id, u) {
    const vendor = this.vendors.get(id);
    if (!vendor) throw new Error("Vendor not found");
    const updated = { ...vendor, ...u };
    this.vendors.set(id, updated);
    return updated;
  }
  async deleteVendor(id) {
    const ordersToDelete = Array.from(this.orders.values()).filter((o) => o.vendorId === id);
    for (const order of ordersToDelete) {
      this.orders.delete(order.id);
    }
    const itemsToDelete = Array.from(this.groceryItems.values()).filter((i) => i.vendorId === id);
    for (const item of itemsToDelete) {
      this.groceryItems.delete(item.id);
    }
    this.vendors.delete(id);
  }
  async getOrders() {
    return Array.from(this.orders.values());
  }
  async createOrder(o) {
    const id = (this.currentId++).toString();
    const order = { ...o, id, totalAmount: o.totalAmount.toString(), createdAt: /* @__PURE__ */ new Date() };
    this.orders.set(id, order);
    return order;
  }
};
var storage = process.env.DATABASE_URL ? new DatabaseStorage(process.env.DATABASE_URL) : new MemStorage();

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app2.get("/api/profile", async (_req, res) => {
    const profile = await storage.getProfile();
    res.json(profile || null);
  });
  app2.get("/api/all-profiles", async (_req, res) => {
    const profiles2 = await storage.getAllProfiles();
    res.json(profiles2);
  });
  app2.post("/api/profile", async (req, res) => {
    const parsed = insertProfileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const profile = await storage.createProfile(parsed.data);
    res.status(201).json(profile);
  });
  app2.get("/api/items", async (req, res) => {
    const vendorId = req.query.vendorId;
    const items = await storage.getGroceryItems(vendorId);
    res.json(items);
  });
  app2.post("/api/items", async (req, res) => {
    const { vendorIds, ...itemData } = req.body;
    if (Array.isArray(vendorIds)) {
      const createdItems = [];
      for (const vId of vendorIds) {
        const item2 = await storage.createGroceryItem({ ...itemData, vendorId: vId });
        createdItems.push(item2);
      }
      return res.status(201).json(createdItems);
    }
    const parsed = insertGroceryItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const item = await storage.createGroceryItem(parsed.data);
    res.status(201).json(item);
  });
  app2.patch("/api/items/:id", async (req, res) => {
    const item = await storage.updateGroceryItem(req.params.id, req.body);
    res.json(item);
  });
  app2.delete("/api/items/:id", async (req, res) => {
    await storage.deleteGroceryItem(req.params.id);
    res.status(204).end();
  });
  app2.get("/api/vendors", async (_req, res) => {
    const vendors2 = await storage.getVendors();
    res.json(vendors2);
  });
  app2.post("/api/vendors", async (req, res) => {
    const parsed = insertVendorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const vendor = await storage.createVendor(parsed.data);
    res.status(201).json(vendor);
  });
  app2.patch("/api/vendors/:id", async (req, res) => {
    const vendor = await storage.updateVendor(req.params.id, req.body);
    res.json(vendor);
  });
  app2.delete("/api/vendors/:id", async (req, res) => {
    try {
      await storage.deleteVendor(req.params.id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      res.status(500).json({ error: error.message || "Failed to delete vendor" });
    }
  });
  app2.get("/api/orders", async (_req, res) => {
    const orders2 = await storage.getOrders();
    res.json(orders2);
  });
  app2.post("/api/orders", async (req, res) => {
    const parsed = insertOrderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const order = await storage.createOrder(parsed.data);
    res.status(201).json(order);
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function serveAdminPage(res) {
  const adminPath = path.resolve(process.cwd(), "server", "templates", "admin.html");
  if (!fs.existsSync(adminPath)) {
    return res.status(404).send("Admin page not found");
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.sendFile(adminPath);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path === "/admin") {
      return serveAdminPage(res);
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0"
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
