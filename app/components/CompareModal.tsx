"use client";

import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ComparisonResult {
  matched: { code: string; qty: number }[];
  missingOnSite: { code: string; qty: number }[]; 
  extraOnSite: { code: string; qty: number }[]; 
}

export default function CompareModal({ isOpen, onClose }: CompareModalProps) {
  const { stickers, bulkAddStickers, bulkRemoveStickers } = useAppContext();
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

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

  const handleCompare = () => {
    const rawList = inputValue
      .replace(/\n/g, ",")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const physicalCounts: Record<string, number> = {};
    rawList.forEach(raw => {
      const code = normalizeCode(raw);
      physicalCounts[code] = (physicalCounts[code] || 0) + 1;
    });

    const siteCounts: Record<string, number> = {};
    stickers.forEach(s => {
      if (s.quantityOwned > 1) {
        siteCounts[s.code] = s.quantityOwned - 1;
      }
    });

    const matched: { code: string; qty: number }[] = [];
    const missingOnSite: { code: string; qty: number }[] = [];
    const extraOnSite: { code: string; qty: number }[] = [];

    const allCodes = Array.from(new Set([...Object.keys(physicalCounts), ...Object.keys(siteCounts)])).sort();

    allCodes.forEach(code => {
      const physQty = physicalCounts[code] || 0;
      const siteQty = siteCounts[code] || 0;

      if (physQty === siteQty && physQty > 0) {
        matched.push({ code, qty: physQty });
      } else if (physQty > siteQty) {
        if (siteQty > 0) matched.push({ code, qty: siteQty });
        missingOnSite.push({ code, qty: physQty - siteQty });
      } else if (siteQty > physQty) {
        if (physQty > 0) matched.push({ code, qty: physQty });
        extraOnSite.push({ code, qty: siteQty - physQty });
      }
    });

    setResult({ matched, missingOnSite, extraOnSite });
  };

  const handleSync = async (type: 'all' | 'missing' | 'extra') => {
    if (!result) return;
    setIsSyncing(true);

    try {
      const codesToAdd: string[] = [];
      if (type === 'all' || type === 'missing') {
        result.missingOnSite.forEach(item => {
          for (let i = 0; i < item.qty; i++) codesToAdd.push(item.code);
        });
      }

      const codesToRemove: string[] = [];
      if (type === 'all' || type === 'extra') {
        result.extraOnSite.forEach(item => {
          for (let i = 0; i < item.qty; i++) codesToRemove.push(item.code);
        });
      }

      if (codesToAdd.length > 0) await bulkAddStickers(codesToAdd);
      if (codesToRemove.length > 0) await bulkRemoveStickers(codesToRemove);

      onClose();
    } catch (error) {
      console.error("Error syncing stickers:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-surface-container-low rounded-2xl border border-outline-variant/50 shadow-2xl overflow-hidden animate-scale-in">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">compare_arrows</span>
              Comparador de Repetidas
            </h3>
            <p className="text-label-sm text-on-surface-variant mt-0.5">
              Reconcilie a sua pilha física com o que está no site.
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
                  1. Cole os códigos da sua pilha física
                </label>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ex: BRA24, ARG01, FWC02..."
                  className="w-full h-40 bg-surface-container p-4 border border-outline-variant/50 rounded-xl text-on-surface font-mono placeholder-on-primary-container outline-none transition-all resize-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                />
                <p className="text-[11px] text-on-surface-variant/70 mt-2">
                  Digite todos os códigos das repetidas que você tem fisicamente em mãos, separados por vírgula ou espaço.
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleCompare}
                  disabled={!inputValue.trim()}
                  className="px-6 py-3 bg-secondary text-on-secondary font-bold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-secondary/20 glow-blue disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">search</span>
                  Comparar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4 rounded-xl border-t-4 border-t-error bg-error/5">
                  <h4 className="font-bold text-error flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-sm">remove_circle</span>
                    Sobra no Site
                  </h4>
                  <p className="text-xs text-on-surface-variant mb-3">Estão no site, mas você não digitou.</p>
                  <div className="flex flex-wrap gap-2">
                    {result.extraOnSite.length === 0 ? <span className="text-xs text-on-surface-variant/50">Nenhuma</span> : null}
                    {result.extraOnSite.map(r => (
                      <span key={r.code} className="text-xs font-mono bg-error/10 text-error px-2 py-1 rounded">
                        {r.code} (x{r.qty})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl border-t-4 border-t-secondary bg-secondary/5">
                  <h4 className="font-bold text-secondary flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Faltando no Site
                  </h4>
                  <p className="text-xs text-on-surface-variant mb-3">Você digitou, mas não estão no site.</p>
                  <div className="flex flex-wrap gap-2">
                    {result.missingOnSite.length === 0 ? <span className="text-xs text-on-surface-variant/50">Nenhuma</span> : null}
                    {result.missingOnSite.map(r => (
                      <span key={r.code} className="text-xs font-mono bg-secondary/10 text-secondary px-2 py-1 rounded">
                        {r.code} (x{r.qty})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-4 rounded-xl border-t-4 border-t-success bg-success/5">
                  <h4 className="font-bold text-success flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Bateu Certinho
                  </h4>
                  <p className="text-xs text-on-surface-variant mb-3">Estão iguais em ambos.</p>
                  <div className="flex flex-wrap gap-2">
                    {result.matched.length === 0 ? <span className="text-xs text-on-surface-variant/50">Nenhuma</span> : null}
                    {result.matched.map(r => (
                      <span key={r.code} className="text-xs font-mono bg-success/10 text-success px-2 py-1 rounded">
                        {r.code} (x{r.qty})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {(result.extraOnSite.length > 0 || result.missingOnSite.length > 0) && (
                <div className="p-4 bg-surface-container-high rounded-xl text-sm text-on-surface">
                  <p className="font-bold mb-1">Ação Recomendada:</p>
                  <p className="text-on-surface-variant">
                    Sincronize para remover automaticamente as {result.extraOnSite.reduce((a,b)=>a+b.qty,0)} sobras do site e adicionar as {result.missingOnSite.reduce((a,b)=>a+b.qty,0)} faltantes, deixando seu álbum digital idêntico à sua pilha física.
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
              Recomeçar
            </button>
          )}
          {result && result.missingOnSite.length > 0 && (
            <button
              onClick={() => handleSync('missing')}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-secondary text-on-secondary font-bold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] flex items-center gap-2 shadow-lg shadow-secondary/20 glow-blue cursor-pointer text-sm"
            >
              {isSyncing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined text-sm">add_circle</span>
              )}
              Adicionar Faltantes
            </button>
          )}
          {result && result.extraOnSite.length > 0 && (
            <button
              onClick={() => handleSync('extra')}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-error text-on-error font-bold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] flex items-center gap-2 shadow-lg shadow-error/20 cursor-pointer text-sm"
            >
              {isSyncing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined text-sm">remove_circle</span>
              )}
              Remover Sobras
            </button>
          )}
          {result && result.extraOnSite.length > 0 && result.missingOnSite.length > 0 && (
            <button
              onClick={() => handleSync('all')}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-on-surface text-surface font-bold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] flex items-center gap-2 shadow-lg cursor-pointer text-sm"
            >
              {isSyncing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined text-sm">sync</span>
              )}
              Sincronizar Tudo
            </button>
          )}
          {(!result || (result.extraOnSite.length === 0 && result.missingOnSite.length === 0)) && (
             <button
             onClick={onClose}
             className="px-6 py-2.5 bg-surface-container-high text-on-surface font-bold rounded-xl transition-all hover:bg-surface-container-highest active:scale-[0.98] cursor-pointer"
           >
             Fechar
           </button>
          )}
        </div>
      </div>
    </div>
  );
}
