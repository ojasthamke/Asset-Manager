import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopName: text("shop_name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  gst: text("gst"), // Optional
  turnover: text("turnover").notNull(),
  role: text("role").notNull(), // 'shop_owner' or 'agency'
  language: text("language").notNull(),
});

export const vendors = pgTable("vendors", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
});

export const groceryItems = pgTable("grocery_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id).notNull(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  imageKey: text("image_key"),
  selected: boolean("selected").notNull().default(false),
  quantity: integer("quantity").notNull().default(1),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProfileSchema = createInsertSchema(profiles);
export const insertGroceryItemSchema = createInsertSchema(groceryItems).extend({
  price: z.string().or(z.number()),
});
export const insertVendorSchema = createInsertSchema(vendors);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type GroceryItem = typeof groceryItems.$inferSelect;
export type InsertGroceryItem = z.infer<typeof insertGroceryItemSchema>;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
