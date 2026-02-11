import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import {
  GroceryItem,
  Vendor,
  OrderHistoryEntry,
  Category,
  UnitType,
  loadItems,
  saveItems,
  loadVendors,
  saveVendors,
  loadRestaurantName,
  saveRestaurantName,
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
}

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [restaurantName, setRestaurantName] = useState("My Restaurant");
  const [history, setHistory] = useState<OrderHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [loadedItems, loadedVendors, loadedName, loadedHistory] = await Promise.all([
        loadItems(),
        loadVendors(),
        loadRestaurantName(),
        loadHistory(),
      ]);
      setItems(loadedItems);
      setVendors(loadedVendors);
      setRestaurantName(loadedName);
      setHistory(loadedHistory);
      setIsLoading(false);
    })();
  }, []);

  const toggleItem = (id: string) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      );
      saveItems(updated);
      return updated;
    });
  };

  const setItemQuantity = (id: string, quantity: number) => {
    if (quantity < 0) return;
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0.5, quantity) } : item,
      );
      saveItems(updated);
      return updated;
    });
  };

  const setItemUnit = (id: string, unit: UnitType) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, unit } : item,
      );
      saveItems(updated);
      return updated;
    });
  };

  const selectAllItems = () => {
    setItems((prev) => {
      const updated = prev.map((item) => ({ ...item, selected: true }));
      saveItems(updated);
      return updated;
    });
  };

  const deselectAllItems = () => {
    setItems((prev) => {
      const updated = prev.map((item) => ({ ...item, selected: false }));
      saveItems(updated);
      return updated;
    });
  };

  const addItem = (name: string, unit: UnitType, category: Category) => {
    const newItem: GroceryItem = {
      id: Crypto.randomUUID(),
      name,
      unit,
      category,
      selected: false,
      quantity: 1,
    };
    setItems((prev) => {
      const updated = [...prev, newItem];
      saveItems(updated);
      return updated;
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveItems(updated);
      return updated;
    });
  };

  const addVendor = (name: string, phone: string) => {
    const newVendor: Vendor = {
      id: Crypto.randomUUID(),
      name,
      phone,
    };
    setVendors((prev) => {
      const updated = [...prev, newVendor];
      saveVendors(updated);
      return updated;
    });
  };

  const removeVendor = (id: string) => {
    setVendors((prev) => {
      const updated = prev.filter((v) => v.id !== id);
      saveVendors(updated);
      return updated;
    });
  };

  const updateVendor = (id: string, name: string, phone: string) => {
    setVendors((prev) => {
      const updated = prev.map((v) =>
        v.id === id ? { ...v, name, phone } : v,
      );
      saveVendors(updated);
      return updated;
    });
  };

  const updateRestaurantName = (name: string) => {
    setRestaurantName(name);
    saveRestaurantName(name);
  };

  const resetSelections = () => {
    setItems((prev) => {
      const updated = prev.map((item) => ({
        ...item,
        selected: false,
        quantity: 1,
      }));
      saveItems(updated);
      return updated;
    });
  };

  const addHistoryEntry = (entry: Omit<OrderHistoryEntry, "id">) => {
    const newEntry: OrderHistoryEntry = {
      ...entry,
      id: Crypto.randomUUID(),
    };
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

  const value = useMemo(
    () => ({
      items,
      vendors,
      restaurantName,
      history,
      isLoading,
      toggleItem,
      setItemQuantity,
      setItemUnit,
      selectAllItems,
      deselectAllItems,
      addItem,
      removeItem,
      addVendor,
      removeVendor,
      updateVendor,
      updateRestaurantName,
      resetSelections,
      addHistoryEntry,
      deleteHistoryEntry,
      clearHistory,
    }),
    [items, vendors, restaurantName, history, isLoading],
  );

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
}
