import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext } from "react";

export interface GroceryItem {
  id: string;
  name: string;
  unit: string;
  selected: boolean;
  quantity: number;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
}

const ITEMS_KEY = "@quickorder_items";
const VENDORS_KEY = "@quickorder_vendors";
const RESTAURANT_KEY = "@quickorder_restaurant";

const DEFAULT_ITEMS: GroceryItem[] = [
  { id: "1", name: "Onion", unit: "kg", selected: false, quantity: 1 },
  { id: "2", name: "Tomato", unit: "kg", selected: false, quantity: 1 },
  { id: "3", name: "Potato", unit: "kg", selected: false, quantity: 1 },
  { id: "4", name: "Paneer", unit: "kg", selected: false, quantity: 1 },
  { id: "5", name: "Cheese", unit: "kg", selected: false, quantity: 1 },
  { id: "6", name: "Cooking Oil", unit: "litre", selected: false, quantity: 1 },
  { id: "7", name: "Chicken", unit: "kg", selected: false, quantity: 1 },
  { id: "8", name: "Butter", unit: "kg", selected: false, quantity: 1 },
  { id: "9", name: "Rice", unit: "kg", selected: false, quantity: 1 },
  { id: "10", name: "Flour (Atta)", unit: "kg", selected: false, quantity: 1 },
  { id: "11", name: "Green Chilli", unit: "kg", selected: false, quantity: 1 },
  { id: "12", name: "Coriander", unit: "bunch", selected: false, quantity: 1 },
  { id: "13", name: "Ginger", unit: "kg", selected: false, quantity: 1 },
  { id: "14", name: "Garlic", unit: "kg", selected: false, quantity: 1 },
  { id: "15", name: "Eggs", unit: "tray", selected: false, quantity: 1 },
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

export function generateOrderMessage(
  items: GroceryItem[],
  vendorName: string,
  restaurantName: string,
): string {
  const selected = items.filter((i) => i.selected);
  if (selected.length === 0) return "";

  const itemLines = selected
    .map((i) => `  \u2022 ${i.name} \u2013 ${i.quantity} ${i.unit}`)
    .join("\n");

  return `Hello ${vendorName} \uD83D\uDC4B\nPlease send the following items:\n\n${itemLines}\n\nThank you\n- ${restaurantName}`;
}

export function getWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
