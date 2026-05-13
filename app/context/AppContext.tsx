"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Sticker, Expense } from "../types";
import defaultData from "../../Figurinhas/checklist-copa-2026.json";
import { createClient } from "../lib/supabase/client";

interface AppState {
  stickers: Sticker[];
  expenses: Expense[];
}

interface AppContextType extends AppState {
  updateSticker: (id: string, updates: Partial<Sticker>) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
  isHydrated: boolean;
  user: any;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({ stickers: defaultData as Sticker[], expenses: [] });
  const [isHydrated, setIsHydrated] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const supabase = createClient();

  // Load from Supabase on mount & auth changes
  useEffect(() => {
    const loadData = async (currentUser: any) => {
      if (!currentUser) {
        setUser(null);
        setState({ stickers: defaultData as Sticker[], expenses: [] });
        setIsHydrated(true);
        return;
      }
      
      setUser(currentUser);

      const [stickersRes, expensesRes] = await Promise.all([
        supabase.from('user_stickers').select('*'),
        supabase.from('expenses').select('*')
      ]);

      const userStickers = stickersRes.data || [];
      const expenses = expensesRes.data || [];

      // Merge defaultData with userStickers
      const mergedStickers = (defaultData as Sticker[]).map((defaultSticker) => {
        const found = userStickers.find((us: any) => us.code === defaultSticker.id);
        if (found) {
          return {
            ...defaultSticker,
            quantityOwned: found.quantity,
            pasted: found.pasted,
            edition: found.edition || 'normal',
            notes: found.notes || ''
          };
        }
        return {
          ...defaultSticker,
          quantityOwned: 0,
          pasted: false,
          edition: 'normal',
          notes: ''
        };
      });

      setState({ stickers: mergedStickers, expenses: expenses as Expense[] });
      setIsHydrated(true);
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadData(session?.user || null);
    });

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadData(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateSticker = async (id: string, updates: Partial<Sticker>) => {
    if (!user) return;

    // Optimistic UI update
    setState(prev => {
      const newStickers = prev.stickers.map(s => s.id === id ? { ...s, ...updates } : s);
      return { ...prev, stickers: newStickers };
    });

    // We must find the sticker AFTER the optimistic update to send the exact current values to DB
    // Actually, we can just apply updates to the existing state finding
    const currentSticker = state.stickers.find(s => s.id === id);
    if (!currentSticker) return;

    const finalSticker = { ...currentSticker, ...updates };

    const { error } = await supabase.from('user_stickers').upsert({
      user_id: user.id,
      code: id,
      quantity: finalSticker.quantityOwned,
      pasted: finalSticker.pasted,
      edition: finalSticker.edition || 'normal',
      notes: finalSticker.notes || ''
    }, { onConflict: 'user_id,code' });

    if (error) {
      console.error("Error updating sticker:", error);
    }
  };

  const addExpense = async (expenseData: Omit<Expense, "id">) => {
    if (!user) return;

    const { data, error } = await supabase.from('expenses').insert([{
      user_id: user.id,
      date: expenseData.date,
      description: expenseData.description,
      amount_spent: expenseData.amountSpent,
      packs_bought: expenseData.packsBought,
      notes: expenseData.notes || ''
    }]).select().single();

    if (error || !data) {
      console.error("Error adding expense", error);
      return;
    }

    const newExpense: Expense = {
      id: data.id,
      date: data.date,
      description: data.description,
      amountSpent: Number(data.amount_spent),
      packsBought: data.packs_bought,
      notes: data.notes
    };

    setState(prev => ({
      ...prev,
      expenses: [...prev.expenses, newExpense]
    }));
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    
    // Optimistic UI
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id)
    }));

    const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <AppContext.Provider value={{ ...state, updateSticker, addExpense, deleteExpense, isHydrated, user, signOut }}>
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
