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
  vendorId: string;
  name: string;
  unit: UnitType;
  category: Category;
  price: string; // Price in Rupees
  imageKey?: string;
  selected: boolean;
  quantity: number;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
}

export interface Profile {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  gst?: string;
  turnover: string;
  role: string;
  language: string;
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

const VENDORS_KEY = "@quickorder_vendors_v3";
const RESTAURANT_KEY = "@quickorder_restaurant";
const HISTORY_KEY = "@quickorder_history";
const PROFILE_KEY = "@quickorder_profile";
const getVendorItemsKey = (vendorId: string) => `@quickorder_items_v3_${vendorId}`;

// Helper to get the correct API URL
function getBaseUrl() {
  return "https://quick-order-server-y11j.onrender.com";
}

export async function loadProfile(): Promise<Profile | null> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/profile`, { signal: AbortSignal.timeout(5000) }).catch(() => null);

    if (response && response.ok) {
      const profile = await response.json();
      if (profile) {
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        return profile;
      }
    }

    const data = await AsyncStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    const data = await AsyncStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  }
}

export async function loadItems(vendorId: string): Promise<GroceryItem[]> {
  const cacheKey = getVendorItemsKey(vendorId);
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/items?vendorId=${vendorId}`, { signal: AbortSignal.timeout(5000) }).catch(() => null);

    if (response && response.ok) {
      const items = await response.json();
      await AsyncStorage.setItem(cacheKey, JSON.stringify(items));
      return items;
    }

    const data = await AsyncStorage.getItem(cacheKey);
    return data ? JSON.parse(data) : [];
  } catch {
    const data = await AsyncStorage.getItem(cacheKey);
    return data ? JSON.parse(data) : [];
  }
}

export async function loadVendors(): Promise<Vendor[]> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/vendors`, { signal: AbortSignal.timeout(5000) }).catch(() => null);

    if (response && response.ok) {
      const vendors = await response.json();
      await AsyncStorage.setItem(VENDORS_KEY, JSON.stringify(vendors));
      return vendors;
    }

    const data = await AsyncStorage.getItem(VENDORS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    const data = await AsyncStorage.getItem(VENDORS_KEY);
    return data ? JSON.parse(data) : [];
  }
}

export async function loadRestaurantName(): Promise<string> {
  try {
    const profile = await loadProfile();
    if (profile) return profile.shopName;

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

  let totalAmount = 0;
  const itemLines = selected
    .map((i) => {
      const price = parseFloat(i.price || "0");
      const lineTotal = price * i.quantity;
      totalAmount += lineTotal;
      return `  \u2022 ${i.name} (${i.quantity} ${getUnitLabel(i.unit)}) - ₹${price.toFixed(2)} x ${i.quantity} = ₹${lineTotal.toFixed(2)}`;
    })
    .join("\n");

  return `Hello ${vendorName} \uD83D\uDC4B\n\nPlease send the following items:\n\n${itemLines}\n\n*Total Amount: ₹${totalAmount.toFixed(2)}*\n\nThank you\n- ${restaurantName}`;
}

export function getWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
