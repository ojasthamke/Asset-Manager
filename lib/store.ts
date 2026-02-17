import AsyncStorage from "@react-native-async-storage/async-storage";

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
  selected: boolean;
  quantity: number;
}

export interface Vendor {
  id:string;
  name: string;
  phone: string;
  isSpecial?: boolean;
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

const VENDORS_KEY = "@quickorder_vendors_v3";
const RESTAURANT_KEY = "@quickorder_restaurant";
const HISTORY_KEY = "@quickorder_history";
const PROFILE_KEY = "@quickorder_profile";
const getVendorItemsKey = (vendorId: string) => `@quickorder_items_v3_${vendorId}`;

// Helper to get the correct API URL
function getBaseUrl() {
  return "https://quick-order-server-y11j.onrender.com";
}

// Increased timeout for Render free tier wakeup (30 seconds)
const FETCH_TIMEOUT = 30000;

/**
 * Custom fetch with timeout as a polyfill for AbortSignal.timeout
 */
async function fetchWithTimeout(url: string, options: any = {}, timeout: number = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function loadProfile(): Promise<Profile | null> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetchWithTimeout(`${baseUrl}/api/profile`);
    if (response.ok) {
      const profile = await response.json();
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile || null));
      return profile;
    }
    console.warn(`Failed to fetch profile: Server responded with status ${response.status}`);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.warn(`Failed to fetch profile: ${err.message}. Falling back to cache.`);
  }

  const data = await AsyncStorage.getItem(PROFILE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse cached profile, returning null.', e);
    }
  }

  return null; // Profile is nullable, so returning null is acceptable on failure.
}

export async function loadItems(vendorId: string): Promise<GroceryItem[]> {
  const cacheKey = getVendorItemsKey(vendorId);
  let networkError: Error | undefined;
  try {
    const baseUrl = getBaseUrl();
    const response = await fetchWithTimeout(`${baseUrl}/api/items?vendorId=${vendorId}`);
    if (response.ok) {
      const items = await response.json();
      await AsyncStorage.setItem(cacheKey, JSON.stringify(items));
      return items;
    }
    networkError = new Error(`Failed to fetch items: Server responded with status ${response.status}`);
  } catch (e) {
    networkError = e instanceof Error ? e : new Error(String(e));
  }

  console.warn(`${networkError.message}. Falling back to cache for items.`);

  const data = await AsyncStorage.getItem(cacheKey);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      const cacheError = e instanceof Error ? e : new Error(String(e));
      throw new Error(`Failed to parse cached items. ${cacheError.message}. Original network error: ${networkError.message}`);
    }
  }

  throw networkError;
}


export async function saveItems(items: GroceryItem[]): Promise<void> {
  // Not used anymore as we fetch from server or cache
}

export async function loadVendors(): Promise<Vendor[]> {
  let networkError: Error | undefined;
  try {
    const baseUrl = getBaseUrl();
    const response = await fetchWithTimeout(`${baseUrl}/api/vendors`);
    if (response.ok) {
      const vendors = await response.json();
      await AsyncStorage.setItem(VENDORS_KEY, JSON.stringify(vendors));
      return vendors;
    }
    networkError = new Error(`Failed to fetch vendors: Server responded with status ${response.status}`);
  } catch (e) {
    networkError = e instanceof Error ? e : new Error(String(e));
  }

  console.warn(`${networkError.message}. Falling back to cache.`);

  const data = await AsyncStorage.getItem(VENDORS_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      // Something is wrong with cached data, combine errors.
      const cacheError = e instanceof Error ? e : new Error(String(e));
      throw new Error(`Failed to parse cached vendors. ${cacheError.message}. Original network error: ${networkError.message}`);
    }
  }

  // If we reach here, network failed and cache is empty. Throw the network error.
  throw networkError;
}

export async function saveVendors(vendors: Vendor[]): Promise<void> {
  await AsyncStorage.setItem(VENDORS_KEY, JSON.stringify(vendors));
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
      return `  • ${i.name} (${i.quantity} ${getUnitLabel(i.unit)}) - ₹${price.toFixed(2)} x ${i.quantity} = ₹${lineTotal.toFixed(2)}`;
    })
    .join("\n");

  return `Hello ${vendorName} 👋

Please send the following items:

${itemLines}

*Total Amount: ₹${totalAmount.toFixed(2)}*

Thank you
- ${restaurantName}`;
}

export function getWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
