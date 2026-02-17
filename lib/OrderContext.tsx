import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GroceryItem,
  Vendor,
  OrderHistoryEntry,
  Category,
  UnitType,
  loadItems,
  loadVendors,
  loadProfile,
  loadHistory,
  saveHistory,
} from "@/lib/store";
import * as Crypto from "expo-crypto";

interface OrderContextValue {
  items: GroceryItem[];
  vendors: Vendor[];
  restaurantName: string;
  history: OrderHistoryEntry[];
  isLoading: boolean;
  toggleItem: (id: string) => void;
  setItemQuantity: (id: string, quantity: number) => void;
  setItemUnit: (id: string, unit: UnitType) => void;
  setItemsDirectly: (newItems: GroceryItem[]) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
  addItem: (name: string, unit: UnitType, category: Category) => void;
  removeItem: (id: string) => void;
  addVendor: (name: string, phone: string) => void;
  removeVendor: (id: string) => void;
  updateVendor: (id: string, name: string, phone: string) => void;
  updateRestaurantName: (name: string) => void;
  resetSelections: () => void;
  addHistoryEntry: (entry: Omit<OrderHistoryEntry, "id">) => void;
  deleteHistoryEntry: (id: string) => void;
  clearHistory: () => void;
  refreshData: () => Promise<void>;
}

const OrderContext = createContext<OrderContextValue | null>(null);

const VENDORS_KEY = "@quickorder_vendors_v3";
const PROFILE_KEY = "@quickorder_profile";

export function OrderProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [restaurantName, setRestaurantName] = useState("My Restaurant");
  const [history, setHistory] = useState<OrderHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        // Load from cache first to show something on screen quickly
        const [localVendors, localProfile, localHistory] = await Promise.all([
          AsyncStorage.getItem(VENDORS_KEY),
          AsyncStorage.getItem(PROFILE_KEY),
          loadHistory(),
        ]);

        if (localVendors) setVendors(JSON.parse(localVendors));
        if (localProfile) {
          const p = JSON.parse(localProfile);
          setRestaurantName(p.shopName || "My Restaurant");
        }
        setHistory(localHistory);

        // Now sync with the cloud.
        await refreshData();
      } catch (e) {
        console.error("Initial data load failed", e);
      } finally {
        // Only set loading to false after the cloud sync has also finished.
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const refreshData = async () => {
    try {
      const [cloudVendors, cloudProfile] = await Promise.all([
        loadVendors(),
        loadProfile(),
      ]);

      // loadVendors/loadProfile will return cached data on network failure,
      // so we can just set state with whatever they return.
      setVendors(cloudVendors);
      if (cloudProfile) setRestaurantName(cloudProfile.shopName);

    } catch (e) {
      // This will mostly catch programming errors, as loadVendors/loadProfile swallow network errors.
      console.warn("Background sync failed:", e);
    }
  };

  const toggleItem = (id: string) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const setItemQuantity = (id: string, quantity: number) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, quantity: Math.max(0.5, quantity) } : item));
  };

  const setItemUnit = (id: string, unit: UnitType) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, unit } : item));
  };

  const setItemsDirectly = (newItems: GroceryItem[]) => setItems(newItems);

  const selectAllItems = () => setItems((prev) => prev.map((item) => ({ ...item, selected: true })));
  const deselectAllItems = () => setItems((prev) => prev.map((item) => ({ ...item, selected: false })));

  const addItem = (name: string, unit: UnitType, category: Category) => {
    const newItem: GroceryItem = { id: Crypto.randomUUID(), vendorId: "common", name, unit, category, price: "0", selected: false, quantity: 1 };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((item) => item.id !== id));

  const addVendor = (name: string, phone: string) => {
    const newVendor: Vendor = { id: Crypto.randomUUID(), name, phone };
    setVendors((prev) => [...prev, newVendor]);
  };

  const removeVendor = (id: string) => setVendors((prev) => prev.filter((v) => v.id !== id));

  const updateVendor = (id: string, name: string, phone: string) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, name, phone } : v)));
  };

  const updateRestaurantName = (name: string) => {
    setRestaurantName(name);
  };

  const resetSelections = () => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: false, quantity: 1 })));
  };

  const addHistoryEntry = (entry: Omit<OrderHistoryEntry, "id">) => {
    const newEntry: OrderHistoryEntry = { ...entry, id: Crypto.randomUUID() };
    setHistory((prev) => {
      const updated = [newEntry, ...prev];
      saveHistory(updated);
      return updated;
    });
  };

  const deleteHistoryEntry = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveHistory(updated);
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const value = useMemo(() => ({
    items, vendors, restaurantName, history, isLoading,
    toggleItem, setItemQuantity, setItemUnit, setItemsDirectly,
    selectAllItems, deselectAllItems, addItem, removeItem,
    addVendor, removeVendor, updateVendor, updateRestaurantName,
    resetSelections, addHistoryEntry, deleteHistoryEntry, clearHistory,
    refreshData
  }), [items, vendors, restaurantName, history, isLoading]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrder must be used within an OrderProvider");
  return context;
}
