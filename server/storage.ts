import { users, type User, type InsertUser, groceryItems, vendors, type GroceryItem, type InsertGroceryItem, type Vendor, type InsertVendor, profiles, type Profile, type InsertProfile } from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import pg from "pg";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const { Pool } = pg;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getProfile(): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;

  getGroceryItems(vendorId?: string): Promise<GroceryItem[]>;
  createGroceryItem(item: InsertGroceryItem): Promise<GroceryItem>;
  updateGroceryItem(id: string, item: Partial<InsertGroceryItem>): Promise<GroceryItem>;
  deleteGroceryItem(id: string): Promise<void>;

  getVendors(): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor>;
  deleteVendor(id: string): Promise<void>;
}

// Memory storage as fallback to ensure the server ALWAYS starts
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private groceryItems: Map<string, GroceryItem> = new Map();
  private vendors: Map<string, Vendor> = new Map();
  private profile: Profile | undefined;
  private currentId: number = 1;

  async getUser(id: string): Promise<User | undefined> { return this.users.get(id); }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }
  async createUser(u: InsertUser): Promise<User> {
    const user = { ...u, id: (this.currentId++).toString() };
    this.users.set(user.id, user);
    return user;
  }
  async getProfile() { return this.profile; }
  async createProfile(p: InsertProfile) {
    this.profile = { ...p, id: "1" };
    return this.profile;
  }
  async getGroceryItems(vendorId?: string) {
    const items = Array.from(this.groceryItems.values());
    return vendorId ? items.filter(i => i.vendorId === vendorId) : items;
  }
  async createGroceryItem(i: InsertGroceryItem) {
    const item = { ...i, id: (this.currentId++).toString(), price: i.price?.toString() || "0.00" } as GroceryItem;
    this.groceryItems.set(item.id, item);
    return item;
  }
  async updateGroceryItem(id: string, update: Partial<InsertGroceryItem>) {
    const item = this.groceryItems.get(id);
    if (!item) throw new Error("Not found");
    const updated = { ...item, ...update };
    if (update.price !== undefined) updated.price = update.price.toString();
    this.groceryItems.set(id, updated);
    return updated;
  }
  async deleteGroceryItem(id: string) { this.groceryItems.delete(id); }
  async getVendors() { return Array.from(this.vendors.values()); }
  async createVendor(v: InsertVendor) {
    const vendor = { ...v, id: (this.currentId++).toString() };
    this.vendors.set(vendor.id, vendor);
    return vendor;
  }
  async updateVendor(id: string, update: Partial<InsertVendor>) {
    const vendor = this.vendors.get(id);
    if (!vendor) throw new Error("Not found");
    const updated = { ...vendor, ...update };
    this.vendors.set(id, updated);
    return updated;
  }
  async deleteVendor(id: string) { this.vendors.delete(id); }
}

export class DatabaseStorage implements IStorage {
  private db;

  constructor(connectionString: string) {
    const pool = new Pool({ connectionString });
    this.db = drizzle(pool);
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db.insert(users).values(insertUser).returning();
    return user;
  }

  async getProfile(): Promise<Profile | undefined> {
    const [profile] = await this.db.select().from(profiles).limit(1);
    return profile;
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const [profile] = await this.db.insert(profiles).values(insertProfile).returning();
    return profile;
  }

  async getGroceryItems(vendorId?: string): Promise<GroceryItem[]> {
    if (vendorId) {
      return await this.db.select().from(groceryItems).where(eq(groceryItems.vendorId, vendorId));
    }
    return await this.db.select().from(groceryItems);
  }

  async createGroceryItem(insertItem: InsertGroceryItem): Promise<GroceryItem> {
    const values = { ...insertItem, price: insertItem.price.toString() };
    const [item] = await this.db.insert(groceryItems).values(values).returning();
    return item;
  }

  async updateGroceryItem(id: string, update: Partial<InsertGroceryItem>): Promise<GroceryItem> {
    const values = { ...update };
    if (update.price !== undefined) values.price = update.price.toString();

    const [item] = await this.db
      .update(groceryItems)
      .set(values)
      .where(eq(groceryItems.id, id))
      .returning();
    if (!item) throw new Error("Item not found");
    return item;
  }

  async deleteGroceryItem(id: string): Promise<void> {
    await this.db.delete(groceryItems).where(eq(groceryItems.id, id));
  }

  async getVendors(): Promise<Vendor[]> {
    return await this.db.select().from(vendors);
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const [vendor] = await this.db.insert(vendors).values(insertVendor).returning();
    return vendor;
  }

  async updateVendor(id: string, update: Partial<InsertVendor>): Promise<Vendor> {
    const [vendor] = await this.db
      .update(vendors)
      .set(update)
      .where(eq(vendors.id, id))
      .returning();
    if (!vendor) throw new Error("Vendor not found");
    return vendor;
  }

  async deleteVendor(id: string): Promise<void> {
    await this.db.delete(vendors).where(eq(vendors.id, id));
  }
}

// Automatically choose between Database and Memory
export const storage = process.env.DATABASE_URL
  ? new DatabaseStorage(process.env.DATABASE_URL)
  : new MemStorage();

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not found. Data will be saved in memory (reset on restart).");
}
