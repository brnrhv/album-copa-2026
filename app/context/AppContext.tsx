"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Sticker, Expense } from "../types";
import defaultData from "../../Figurinhas/checklist-copa-2026.json";
import { createClient } from "../lib/supabase/client";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  username: string;
  hide_album?: boolean;
  hide_trades?: boolean;
}

interface AppState {
  stickers: Sticker[];
  expenses: Expense[];
  profile: UserProfile | null;
}

interface AppContextType extends AppState {
  updateSticker: (id: string, updates: Partial<Sticker>) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
  updateProfile: (updates: { full_name?: string; avatar_url?: string | null; hide_album?: boolean; hide_trades?: boolean }) => Promise<void>;
  bulkAddStickers: (rawCodes: string[]) => Promise<{ success: number; notFound: string[] }>;
  isHydrated: boolean;
  user: any;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({ stickers: defaultData as Sticker[], expenses: [], profile: null });
  const [isHydrated, setIsHydrated] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const supabase = createClient();

  // Load from Supabase on mount & auth changes
  useEffect(() => {
    const loadData = async (currentUser: any) => {
      if (!currentUser) {
        setUser(null);
        setState({ stickers: defaultData as Sticker[], expenses: [], profile: null });
        setIsHydrated(true);
        return;
      }
      
      setUser(currentUser);

      const [stickersRes, expensesRes, profileRes] = await Promise.all([
        supabase.from('user_stickers').select('*').eq('user_id', currentUser.id),
        supabase.from('expenses').select('*').eq('user_id', currentUser.id),
        supabase.from('profiles').select('*').eq('id', currentUser.id).single()
      ]);

      const userStickers = stickersRes.data || [];
      const expenses = expensesRes.data || [];
      const profile = profileRes.data || null;

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

      setState({ stickers: mergedStickers, expenses: expenses as Expense[], profile });
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

  const bulkAddStickers = async (rawCodes: string[]): Promise<{ success: number; notFound: string[] }> => {
    if (!user) return { success: 0, notFound: [] };

    const normalizeCode = (raw: string): string => {
      let cleaned = raw.replace(/\s+/g, '').toUpperCase();
      const match = cleaned.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const prefix = match[1];
        let num = match[2];
        if (num.length === 1) {
          num = '0' + num;
        }
        return prefix + num;
      }
      return cleaned;
    };

    const notFoundCodes: string[] = [];
    const updatedStickersMap = new Map<string, Partial<Sticker>>();

    // Process each raw code
    for (const raw of rawCodes) {
      const cleaned = raw.trim();
      if (!cleaned) continue;
      const normalized = normalizeCode(cleaned);
      
      // Find original sticker
      const sticker = state.stickers.find(s => s.id === normalized || s.code === normalized);
      if (!sticker) {
        notFoundCodes.push(cleaned);
        continue;
      }

      // If sticker already in this update batch, base next increment on that
      const currentBatchState = updatedStickersMap.get(sticker.id) || {};
      const baseQuantity = currentBatchState.quantityOwned !== undefined 
        ? currentBatchState.quantityOwned 
        : sticker.quantityOwned;

      updatedStickersMap.set(sticker.id, {
        ...currentBatchState,
        quantityOwned: baseQuantity + 1,
      });
    }

    if (updatedStickersMap.size === 0) {
      return { success: 0, notFound: notFoundCodes };
    }

    const updatesToApply: { id: string; updates: Partial<Sticker> }[] = [];
    const rowsToUpsert: any[] = [];

    updatedStickersMap.forEach((updates, stickerId) => {
      const original = state.stickers.find(s => s.id === stickerId)!;
      const finalUpdates = {
        quantityOwned: updates.quantityOwned!
      };
      updatesToApply.push({ id: stickerId, updates: finalUpdates });
      rowsToUpsert.push({
        user_id: user.id,
        code: stickerId,
        quantity: finalUpdates.quantityOwned,
        pasted: original.pasted,
        edition: original.edition || 'normal',
        notes: original.notes || ''
      });
    });

    // Optimistic UI update
    setState(prev => {
      const newStickers = prev.stickers.map(s => {
        const match = updatesToApply.find(u => u.id === s.id);
        return match ? { ...s, ...match.updates } : s;
      });
      return { ...prev, stickers: newStickers };
    });

    // Batch upsert to Supabase
    const { error } = await supabase.from('user_stickers').upsert(rowsToUpsert, { onConflict: 'user_id,code' });
    
    if (error) {
      console.error("Error bulk updating stickers:", error);
    }

    return { success: updatesToApply.length, notFound: notFoundCodes };
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

  const updateProfile = async (updates: { full_name?: string; avatar_url?: string | null; hide_album?: boolean; hide_trades?: boolean }) => {
    if (!user) return;

    // Optimistic UI
    setState(prev => ({
      ...prev,
      profile: prev.profile ? { ...prev.profile, ...updates } : null
    }));

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      username: state.profile?.username,
      full_name: updates.full_name !== undefined ? updates.full_name : state.profile?.full_name,
      avatar_url: updates.avatar_url !== undefined ? updates.avatar_url : state.profile?.avatar_url,
      hide_album: updates.hide_album !== undefined ? updates.hide_album : (state.profile?.hide_album || false),
      hide_trades: updates.hide_trades !== undefined ? updates.hide_trades : (state.profile?.hide_trades || false),
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    if (error) {
      console.error("Error updating profile:", error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <AppContext.Provider value={{ ...state, updateSticker, bulkAddStickers, addExpense, deleteExpense, updateProfile, isHydrated, user, signOut }}>
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
