import { users, type User, type InsertUser, groceryItems, vendors, type GroceryItem, type InsertGroceryItem, type Vendor, type InsertVendor, profiles, type Profile, type InsertProfile, orders, type Order, type InsertOrder } from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, or } from "drizzle-orm";
import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();
const { Pool } = pg;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getProfile(): Promise<Profile | undefined>;
  getAllProfiles(): Promise<Profile[]>;
  createProfile(profile: InsertProfile): Promise<Profile>;

  getGroceryItems(vendorId?: string): Promise<GroceryItem[]>;
  createGroceryItem(item: InsertGroceryItem): Promise<GroceryItem>;
  updateGroceryItem(id: string, item: Partial<InsertGroceryItem>): Promise<GroceryItem>;
  deleteGroceryItem(id: string): Promise<void>;

  getVendors(): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor>;
  deleteVendor(id: string): Promise<void>;

  getOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
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
  async getAllProfiles(): Promise<Profile[]> {
    return await this.db.select().from(profiles);
  }
  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const [profile] = await this.db.insert(profiles).values(insertProfile).returning();
    return profile;
  }
  async getGroceryItems(vendorId?: string): Promise<GroceryItem[]> {
    if (vendorId) {
      return await this.db.select().from(groceryItems).where(
        or(eq(groceryItems.vendorId, vendorId), eq(groceryItems.vendorId, 'common'))
      );
    }
    return await this.db.select().from(groceryItems);
  }
  async createGroceryItem(insertItem: InsertGroceryItem): Promise<GroceryItem> {
    const [item] = await this.db.insert(groceryItems).values({ ...insertItem, price: insertItem.price.toString() }).returning();
    return item;
  }
  async updateGroceryItem(id: string, update: Partial<InsertGroceryItem>): Promise<GroceryItem> {
    const values = { ...update };
    if (update.price !== undefined) values.price = update.price.toString();
    const [item] = await this.db.update(groceryItems).set(values).where(eq(groceryItems.id, id)).returning();
    return item!;
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
    const [vendor] = await this.db.update(vendors).set(update).where(eq(vendors.id, id)).returning();
    return vendor!;
  }
  async deleteVendor(id: string): Promise<void> {
    await this.db.delete(vendors).where(eq(vendors.id, id));
  }
  async getOrders(): Promise<Order[]> {
    return await this.db.select().from(orders);
  }
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await this.db.insert(orders).values({ ...insertOrder, totalAmount: insertOrder.totalAmount.toString() }).returning();
    return order;
  }
}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private groceryItems = new Map<string, GroceryItem>();
  private vendors = new Map<string, Vendor>();
  private profiles = new Map<string, Profile>();
  private orders = new Map<string, Order>();
  private currentId = 1;

  async getUser(id: string) { return this.users.get(id); }
  async getUserByUsername(username: string) { return Array.from(this.users.values()).find(u => u.username === username); }
  async createUser(u: InsertUser) { const id = (this.currentId++).toString(); const user = { ...u, id }; this.users.set(id, user); return user; }
  async getProfile() { return Array.from(this.profiles.values())[0]; }
  async getAllProfiles() { return Array.from(this.profiles.values()); }
  async createProfile(p: InsertProfile) { const id = (this.currentId++).toString(); const profile = { ...p, id }; this.profiles.set(id, profile); return profile; }
  async getGroceryItems(vendorId?: string) {
    const items = Array.from(this.groceryItems.values());
    return vendorId ? items.filter(i => i.vendorId === vendorId || i.vendorId === 'common') : items;
  }
  async createGroceryItem(i: InsertGroceryItem) { const id = (this.currentId++).toString(); const item = { ...i, id, price: i.price.toString() } as GroceryItem; this.groceryItems.set(id, item); return item; }
  async updateGroceryItem(id: string, u: Partial<InsertGroceryItem>) {
    const item = this.groceryItems.get(id);
    const updated = { ...item!, ...u };
    if (u.price) updated.price = u.price.toString();
    this.groceryItems.set(id, updated);
    return updated;
  }
  async deleteGroceryItem(id: string) { this.groceryItems.delete(id); }
  async getVendors() { return Array.from(this.vendors.values()); }
  async createVendor(v: InsertVendor) { const id = (this.currentId++).toString(); const vendor = { ...v, id, isSpecial: v.isSpecial ?? false }; this.vendors.set(id, vendor); return vendor; }
  async updateVendor(id: string, u: Partial<InsertVendor>) { const vendor = this.vendors.get(id); const updated = { ...vendor!, ...u }; this.vendors.set(id, updated); return updated; }
  async deleteVendor(id: string) { this.vendors.delete(id); }
  async getOrders() { return Array.from(this.orders.values()); }
  async createOrder(o: InsertOrder) { const id = (this.currentId++).toString(); const order = { ...o, id, totalAmount: o.totalAmount.toString(), createdAt: new Date() }; this.orders.set(id, order); return order; }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage(process.env.DATABASE_URL) : new MemStorage();
