import AsyncStorage from "@react-native-async-storage/async-storage";
import { ImageSourcePropType } from "react-native";

export type UnitType = "g" | "kg" | "litre" | "pieces" | "bunch" | "tray" | "packet";

export const UNIT_OPTIONS: { label: string; value: UnitType }[] = [
  { label: "g", value: "g" },
  { label: "kg", value: "kg" },
  { label: "L", value: "litre" },
  { label: "pcs", value: "pieces" },
  { label: "bunch", value: "bunch" },
  { label: "tray", value: "tray" },
  { label: "pkt", value: "packet" },
];

export type Category = "Vegetables" | "Dairy" | "Meat & Eggs" | "Staples" | "Spices & Herbs";

export const CATEGORIES: Category[] = [
  "Vegetables",
  "Dairy",
  "Meat & Eggs",
  "Staples",
  "Spices & Herbs",
];

export interface GroceryItem {
  id: string;
  name: string;
  unit: UnitType;
  category: Category;
  imageKey?: string;
  selected: boolean;
  quantity: number;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
}

export interface OrderHistoryEntry {
  id: string;
  date: string;
  vendorName: string;
  vendorPhone: string;
  items: { name: string; quantity: number; unit: string }[];
  message: string;
}

const ITEM_IMAGES: Record<string, ImageSourcePropType> = {
  onion: require("../assets/images/items/onion.jpg"),
  tomato: require("../assets/images/items/tomato.jpg"),
  potato: require("../assets/images/items/potato.jpg"),
  paneer: require("../assets/images/items/paneer.jpg"),
  cheese: require("../assets/images/items/cheese.jpg"),
  "cooking-oil": require("../assets/images/items/cooking-oil.jpg"),
  chicken: require("../assets/images/items/chicken.jpg"),
  butter: require("../assets/images/items/butter.jpg"),
  rice: require("../assets/images/items/rice.jpg"),
  flour: require("../assets/images/items/flour.jpg"),
  "green-chilli": require("../assets/images/items/green-chilli.jpg"),
  coriander: require("../assets/images/items/coriander.jpg"),
  ginger: require("../assets/images/items/ginger.jpg"),
  garlic: require("../assets/images/items/garlic.jpg"),
  eggs: require("../assets/images/items/eggs.jpg"),
};

export function getItemImage(imageKey?: string): ImageSourcePropType | null {
  if (!imageKey) return null;
  return ITEM_IMAGES[imageKey] || null;
}

const ITEMS_KEY = "@quickorder_items_v2";
const VENDORS_KEY = "@quickorder_vendors";
const RESTAURANT_KEY = "@quickorder_restaurant";
const HISTORY_KEY = "@quickorder_history";

const DEFAULT_ITEMS: GroceryItem[] = [
  { id: "1", name: "Onion", unit: "kg", category: "Vegetables", imageKey: "onion", selected: false, quantity: 1 },
  { id: "2", name: "Tomato", unit: "kg", category: "Vegetables", imageKey: "tomato", selected: false, quantity: 1 },
  { id: "3", name: "Potato", unit: "kg", category: "Vegetables", imageKey: "potato", selected: false, quantity: 1 },
  { id: "4", name: "Green Chilli", unit: "kg", category: "Vegetables", imageKey: "green-chilli", selected: false, quantity: 1 },
  { id: "5", name: "Paneer", unit: "kg", category: "Dairy", imageKey: "paneer", selected: false, quantity: 1 },
  { id: "6", name: "Cheese", unit: "kg", category: "Dairy", imageKey: "cheese", selected: false, quantity: 1 },
  { id: "7", name: "Butter", unit: "kg", category: "Dairy", imageKey: "butter", selected: false, quantity: 1 },
  { id: "8", name: "Chicken", unit: "kg", category: "Meat & Eggs", imageKey: "chicken", selected: false, quantity: 1 },
  { id: "9", name: "Eggs", unit: "tray", category: "Meat & Eggs", imageKey: "eggs", selected: false, quantity: 1 },
  { id: "10", name: "Cooking Oil", unit: "litre", category: "Staples", imageKey: "cooking-oil", selected: false, quantity: 1 },
  { id: "11", name: "Rice", unit: "kg", category: "Staples", imageKey: "rice", selected: false, quantity: 1 },
  { id: "12", name: "Flour (Atta)", unit: "kg", category: "Staples", imageKey: "flour", selected: false, quantity: 1 },
  { id: "13", name: "Coriander", unit: "bunch", category: "Spices & Herbs", imageKey: "coriander", selected: false, quantity: 1 },
  { id: "14", name: "Ginger", unit: "kg", category: "Spices & Herbs", imageKey: "ginger", selected: false, quantity: 1 },
  { id: "15", name: "Garlic", unit: "kg", category: "Spices & Herbs", imageKey: "garlic", selected: false, quantity: 1 },
];

const DEFAULT_VENDORS: Vendor[] = [
  { id: "1", name: "Ramesh Veg Supplier", phone: "919876543210" },
  { id: "2", name: "Suresh Dairy", phone: "919876543211" },
  { id: "3", name: "Chicken Center", phone: "919876543212" },
];

export async function loadItems(): Promise<GroceryItem[]> {
  try {
    const data = await AsyncStorage.getItem(ITEMS_KEY);
    if (data) return JSON.parse(data);
    await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(DEFAULT_ITEMS));
    return DEFAULT_ITEMS;
  } catch {
    return DEFAULT_ITEMS;
  }
}

export async function saveItems(items: GroceryItem[]): Promise<void> {
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export async function loadVendors(): Promise<Vendor[]> {
  try {
    const data = await AsyncStorage.getItem(VENDORS_KEY);
    if (data) return JSON.parse(data);
    await AsyncStorage.setItem(VENDORS_KEY, JSON.stringify(DEFAULT_VENDORS));
    return DEFAULT_VENDORS;
  } catch {
    return DEFAULT_VENDORS;
  }
}

export async function saveVendors(vendors: Vendor[]): Promise<void> {
  await AsyncStorage.setItem(VENDORS_KEY, JSON.stringify(vendors));
}

export async function loadRestaurantName(): Promise<string> {
  try {
    const name = await AsyncStorage.getItem(RESTAURANT_KEY);
    return name || "My Restaurant";
  } catch {
    return "My Restaurant";
  }
}

export async function saveRestaurantName(name: string): Promise<void> {
  await AsyncStorage.setItem(RESTAURANT_KEY, name);
}

export async function loadHistory(): Promise<OrderHistoryEntry[]> {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    if (data) return JSON.parse(data);
    return [];
  } catch {
    return [];
  }
}

export async function saveHistory(history: OrderHistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function getUnitLabel(unit: UnitType): string {
  const found = UNIT_OPTIONS.find((u) => u.value === unit);
  return found ? found.label : unit;
}

export function generateOrderMessage(
  items: GroceryItem[],
  vendorName: string,
  restaurantName: string,
): string {
  const selected = items.filter((i) => i.selected);
  if (selected.length === 0) return "";

  const itemLines = selected
    .map((i) => `  \u2022 ${i.name} \u2013 ${i.quantity} ${getUnitLabel(i.unit)}`)
    .join("\n");

  return `Hello ${vendorName} \uD83D\uDC4B\nPlease send the following items:\n\n${itemLines}\n\nThank you\n- ${restaurantName}`;
}

export function getWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
