"use client";

import { useState, useEffect } from "react";
import { Sticker } from "../types";

interface StickerModalProps {
  sticker: Sticker | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Sticker>) => void;
}

export default function StickerModal({ sticker, isOpen, onClose, onSave }: StickerModalProps) {
  const [qty, setQty] = useState(0);
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [edition, setEdition] = useState<'normal' | 'shiny' | 'lilac' | 'bronze' | 'silver' | 'gold'>('normal');

  useEffect(() => {
    if (sticker) {
      setQty(sticker.quantityOwned);
      setNotes(sticker.notes || "");
      setName(sticker.name || "");
      setEdition(sticker.edition || 'normal');
    }
  }, [sticker]);

  if (!isOpen || !sticker) return null;

  const handleSave = () => {
    onSave(sticker.id, {
      quantityOwned: qty,
      notes: notes,
      name: name,
      edition: edition === 'normal' ? undefined : edition
    });
    onClose();
  };

  const status = qty === 0 ? "Missing" : (qty === 1 ? "Collected" : "Repeated");
  const repeatedQty = qty > 1 ? qty - 1 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container rounded-xl w-full max-w-md border border-outline-variant shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-outline-variant flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label-sm text-secondary bg-secondary-container/20 px-2 py-0.5 rounded">{sticker.team}</span>
              <span className="font-label-sm text-tertiary bg-tertiary-container/20 px-2 py-0.5 rounded">{sticker.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter player name..."
                className="font-headline-lg text-on-surface bg-transparent border-b border-transparent focus:border-secondary outline-none w-full max-w-[200px] placeholder:text-on-surface-variant/40"
              />
              <span className="text-on-surface-variant font-normal text-lg">({sticker.code})</span>
            </div>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-lg">
            <span className="font-body-md text-on-surface-variant">Current Status:</span>
            <span className={`font-label-sm px-3 py-1 rounded-full ${
              status === "Missing" ? "bg-error-container text-error" :
              status === "Collected" ? "bg-secondary-container/30 text-secondary" :
              "bg-tertiary-container/30 text-tertiary"
            }`}>{status}</span>
          </div>

          <div className="space-y-2">
            <label className="font-label-sm text-on-primary-container block">Quantity Owned</label>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setQty(Math.max(0, qty - 1))}
                className="w-10 h-10 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center hover:bg-surface-container-highest active:scale-95"
              >
                <span className="material-symbols-outlined text-on-surface">remove</span>
              </button>
              <span className="font-headline-md text-on-surface w-8 text-center">{qty}</span>
              <button 
                onClick={() => setQty(qty + 1)}
                className="w-10 h-10 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center hover:bg-surface-container-highest active:scale-95"
              >
                <span className="material-symbols-outlined text-on-surface">add</span>
              </button>
              {repeatedQty > 0 && (
                <span className="ml-auto font-label-sm text-tertiary bg-tertiary/10 px-3 py-1 rounded">
                  {repeatedQty} for trade
                </span>
              )}
            </div>
          </div>


          <div className="space-y-2">
            <label className="font-label-sm text-on-primary-container block">Card Edition</label>
            <div className="flex gap-2 flex-wrap">
              {(['normal', 'shiny', 'lilac', 'bronze', 'silver', 'gold'] as const).map(ed => (
                <button
                  key={ed}
                  onClick={() => setEdition(ed)}
                  className={`flex-1 py-1.5 px-2 rounded font-label-sm capitalize transition-all border ${
                    edition === ed
                      ? 'border-secondary bg-secondary/20 text-secondary font-bold shadow-lg'
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {ed}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-label-sm text-on-primary-container block">Notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Slightly damaged corner..."
              className="w-full bg-surface-container-lowest border border-outline-variant rounded p-3 text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none font-body-md min-h-[80px]"
            />
          </div>
        </div>

        <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-low">
          <button onClick={onClose} className="px-5 py-2 rounded font-label-sm text-on-surface hover:bg-surface-container-high transition-colors">
            CANCEL
          </button>
          <button onClick={handleSave} className="px-5 py-2 rounded font-label-sm bg-secondary text-on-secondary hover:bg-secondary/90 transition-colors shadow-lg glow-blue">
            SAVE CHANGES
          </button>
        </div>
      </div>
    </div>
  );
}
