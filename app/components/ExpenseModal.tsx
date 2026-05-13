"use client";

import { useState } from "react";
import { Expense } from "../types";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, "id">) => void;
}

export default function ExpenseModal({ isOpen, onClose, onSave }: ExpenseModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [packs, setPacks] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      description,
      amountSpent: parseFloat(amount) || 0,
      packsBought: parseInt(packs, 10) || 0,
      notes,
    });
    // Reset form
    setDescription("");
    setAmount("");
    setPacks("");
    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container rounded-xl w-full max-w-md border border-outline-variant shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <h2 className="font-headline-lg text-on-surface">Log Expense</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="font-label-sm text-on-primary-container block mb-1">Date</label>
            <input 
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded p-3 text-on-surface outline-none"
            />
          </div>
          
          <div>
            <label className="font-label-sm text-on-primary-container block mb-1">Description</label>
            <input 
              type="text"
              required
              placeholder="e.g., Bought 10 packs at local store"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded p-3 text-on-surface outline-none placeholder:text-on-surface-variant/50"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="font-label-sm text-on-primary-container block mb-1">Amount Spent ($)</label>
              <input 
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded p-3 text-on-surface outline-none placeholder:text-on-surface-variant/50"
              />
            </div>
            <div className="flex-1">
              <label className="font-label-sm text-on-primary-container block mb-1">Packs Bought</label>
              <input 
                type="number"
                min="0"
                placeholder="0"
                value={packs}
                onChange={(e) => setPacks(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded p-3 text-on-surface outline-none placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          <div>
            <label className="font-label-sm text-on-primary-container block mb-1">Notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional info..."
              className="w-full bg-surface-container-lowest border border-outline-variant rounded p-3 text-on-surface outline-none placeholder:text-on-surface-variant/50 min-h-[80px]"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded font-label-sm text-on-surface hover:bg-surface-container-high transition-colors">
              CANCEL
            </button>
            <button type="submit" className="px-5 py-2 rounded font-label-sm bg-secondary text-on-secondary hover:bg-secondary/90 transition-colors shadow-lg glow-blue">
              ADD EXPENSE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
