"use client";

import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";

interface WantedStickersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WantedResult {
  needed: { code: string }[];
  alreadyHave: { code: string }[];
  invalid: string[];
}

export default function WantedStickersModal({ isOpen, onClose }: WantedStickersModalProps) {
  const { stickers } = useAppContext();
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<WantedResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue("");
      setResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizeCode = (raw: string): string => {
    let cleaned = raw.replace(/\s+/g, '').toUpperCase();
    const match = cleaned.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const prefix = match[1];
      let num = match[2];
      if (num.length === 1) num = '0' + num;
      return prefix + num;
    }
    return cleaned;
  };

  const handleCheck = () => {
    const rawList = inputValue
      .replace(/\n/g, ",")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const needed: { code: string }[] = [];
    const alreadyHave: { code: string }[] = [];
    const invalid: string[] = [];

    rawList.forEach(raw => {
      const code = normalizeCode(raw);
      const sticker = stickers.find(s => s.code === code);
      if (!sticker) {
        if (!invalid.includes(raw)) invalid.push(raw);
      } else if (sticker.quantityOwned === 0) {
        if (!needed.find(n => n.code === code)) needed.push({ code });
      } else {
        if (!alreadyHave.find(a => a.code === code)) alreadyHave.push({ code });
      }
    });

    setResult({ needed, alreadyHave, invalid });
  };

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-surface-container-low rounded-2xl border border-outline-variant/50 shadow-2xl overflow-hidden animate-scale-in">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">checklist</span>
              Verificador de Lista
            </h3>
            <p className="text-label-sm text-on-surface-variant mt-0.5">
              Descubra quais figurinhas de uma lista você ainda precisa.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
          {!result ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-2">
                  Cole a lista de figurinhas (ex: lista de repetidas de um amigo)
                </label>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ex: BRA24, ARG01, FWC02..."
                  className="w-full h-40 bg-surface-container p-4 border border-outline-variant/50 rounded-xl text-on-surface font-mono placeholder-on-primary-container outline-none transition-all resize-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                />
                <p className="text-[11px] text-on-surface-variant/70 mt-2">
                  Cole os códigos separados por vírgula, espaço ou quebra de linha.
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleCheck}
                  disabled={!inputValue.trim()}
                  className="px-6 py-3 bg-secondary text-on-secondary font-bold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-secondary/20 glow-blue disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">search</span>
                  Verificar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-xl border-t-4 border-t-secondary bg-secondary/5">
                  <h4 className="font-bold text-secondary flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-sm">new_releases</span>
                    Você Precisa ({result.needed.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.needed.length === 0 ? <span className="text-xs text-on-surface-variant/50">Nenhuma figurinha útil na lista.</span> : null}
                    {result.needed.map(r => (
                      <span key={r.code} className="text-xs font-mono bg-secondary/10 text-secondary px-2 py-1 rounded">
                        {r.code}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl border-t-4 border-t-surface-variant bg-surface-variant/5">
                  <h4 className="font-bold text-on-surface-variant flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-sm">done_all</span>
                    Já Tem ({result.alreadyHave.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.alreadyHave.length === 0 ? <span className="text-xs text-on-surface-variant/50">Nenhuma figurinha que você já tem.</span> : null}
                    {result.alreadyHave.map(r => (
                      <span key={r.code} className="text-xs font-mono bg-surface-variant/20 text-on-surface-variant px-2 py-1 rounded">
                        {r.code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {result.invalid.length > 0 && (
                <div className="p-4 bg-error/10 rounded-xl text-sm text-on-surface">
                  <p className="font-bold text-error mb-1">Códigos não reconhecidos:</p>
                  <p className="text-error/80 font-mono text-xs">
                    {result.invalid.join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container flex-wrap">
          {result && (
            <button
              onClick={() => setResult(null)}
              className="px-5 py-2.5 text-label-md font-semibold text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors cursor-pointer"
            >
              Verificar Outra Lista
            </button>
          )}
          <button
             onClick={onClose}
             className="px-6 py-2.5 bg-surface-container-high text-on-surface font-bold rounded-xl transition-all hover:bg-surface-container-highest active:scale-[0.98] cursor-pointer"
           >
             Fechar
           </button>
        </div>
      </div>
    </div>
  );
}
