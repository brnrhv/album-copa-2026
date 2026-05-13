"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Sticker, Expense } from "../types";
import defaultData from "../../Figurinhas/checklist-copa-2026.json";

interface AppState {
  stickers: Sticker[];
  expenses: Expense[];
}

interface AppContextType extends AppState {
  updateSticker: (id: string, updates: Partial<Sticker>) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
  isHydrated: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({ stickers: [], expenses: [] });
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("worldCupAlbumData");
    if (savedData) {
      setState(JSON.parse(savedData));
    } else {
      // Seed initial data if first time
      const initialState = { stickers: defaultData as Sticker[], expenses: [] };
      setState(initialState);
      localStorage.setItem("worldCupAlbumData", JSON.stringify(initialState));
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever state changes, after hydration
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("worldCupAlbumData", JSON.stringify(state));
    }
  }, [state, isHydrated]);

  const updateSticker = (id: string, updates: Partial<Sticker>) => {
    setState(prev => ({
      ...prev,
      stickers: prev.stickers.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const addExpense = (expenseData: Omit<Expense, "id">) => {
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
    };
    setState(prev => ({
      ...prev,
      expenses: [...prev.expenses, newExpense]
    }));
  };

  const deleteExpense = (id: string) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id)
    }));
  };

  return (
    <AppContext.Provider value={{ ...state, updateSticker, addExpense, deleteExpense, isHydrated }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}
