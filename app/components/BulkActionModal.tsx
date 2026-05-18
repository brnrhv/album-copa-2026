"use client";

import React, { useState, useEffect } from "react";

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (rawCodes: string[]) => Promise<{ success: number; notFound: string[] }>;
  onRemove: (rawCodes: string[]) => Promise<{ success: number; notFound: string[] }>;
  initialMode?: "add" | "remove";
}

export default function BulkActionModal({
  isOpen,
  onClose,
  onAdd,
  onRemove,
  initialMode = "add",
}: BulkActionModalProps) {
  const [mode, setMode] = useState<"add" | "remove">(initialMode);
  const [inputValue, setInputValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<{ success: number; notFound: string[] } | null>(null);

  // Sync mode state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setResult(null);
      setInputValue("");
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rawList = inputValue
      .replace(/\n/g, ",") // convert newlines to commas
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawList.length === 0) return;

    setIsSaving(true);
    setResult(null);
    try {
      const saveFn = mode === "add" ? onAdd : onRemove;
      const res = await saveFn(rawList);
      setResult(res);
      // Clear input if successful
      if (res.success > 0) {
        setInputValue("");
      }
    } catch (error) {
      console.error(`Failed to bulk ${mode}`, error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setInputValue("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center p-4">
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
      />

      <div className="relative w-full max-w-lg bg-surface-container-low dark:bg-surface-container-low rounded-2xl border border-outline-variant/50 shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold flex items-center gap-2">
              <span className={`material-symbols-outlined ${mode === "add" ? "text-secondary" : "text-error"}`}>
                {mode === "add" ? "playlist_add" : "playlist_remove"}
              </span>
              {mode === "add" ? "Adicionar em Massa" : "Remover em Massa"}
            </h3>
            <p className="text-label-sm text-on-surface-variant mt-0.5">
              Cole uma lista de códigos separados por vírgula ou espaço
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Dynamic Tabs Selector */}
        <div className="flex border-b border-outline-variant/30 bg-surface-container-low p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              setMode("add");
              setResult(null);
            }}
            className={`flex-1 py-3 text-label-md font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === "add"
                ? "bg-secondary text-on-secondary shadow-md"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-lg">playlist_add</span>
            Adicionar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("remove");
              setResult(null);
            }}
            className={`flex-1 py-3 text-label-md font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === "remove"
                ? "bg-error text-on-error shadow-md"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-lg">playlist_remove</span>
            Remover
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-label-md font-semibold text-on-surface mb-2">
              Lista de Códigos
            </label>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isSaving}
              placeholder="Ex: BRA1, BRA2, ARG10, FRA 07"
              className={`w-full h-32 bg-surface-container p-4 border border-outline-variant/50 rounded-xl text-on-surface font-mono placeholder-on-primary-container outline-none transition-all resize-none ${
                mode === "add"
                  ? "focus:border-secondary focus:ring-1 focus:ring-secondary"
                  : "focus:border-error focus:ring-1 focus:ring-error"
              }`}
            />
            <p className="text-[11px] text-on-surface-variant/70 mt-2">
              💡 Aceita minúsculas e formatações variadas (ex: 'bra 1' vira 'BRA01'). Separe com vírgulas ou pulando linhas.
            </p>
          </div>

          {/* Result Message Box */}
          {result && (
            <div
              className={`p-4 rounded-xl border ${
                result.success > 0 && result.notFound.length === 0
                  ? mode === "add"
                    ? "bg-success/10 border-success/30 text-success"
                    : "bg-error/10 border-error/30 text-error"
                  : result.success > 0
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-error/10 border-error/30 text-error"
              } flex flex-col gap-1.5 text-sm`}
            >
              <div className="flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-lg">
                  {result.success > 0 ? "check_circle" : "error"}
                </span>
                {result.success > 0
                  ? `${result.success} figurinhas ${mode === "add" ? "adicionadas" : "removidas"} com sucesso!`
                  : `Nenhuma figurinha ${mode === "add" ? "adicionada" : "removida"}.`}
              </div>

              {result.notFound.length > 0 && (
                <div className="mt-1 pt-1.5 border-t border-current/20 flex flex-col gap-1">
                  {result.notFound.map((code, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <span className="material-symbols-outlined text-xs text-error">warning</span>
                      <span>
                        Não encontrei o código:{" "}
                        <strong className="font-mono bg-black/20 px-1 rounded">{code}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 text-label-md font-semibold text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors cursor-pointer"
            >
              {result ? "Fechar" : "Cancelar"}
            </button>
            <button
              type="submit"
              disabled={isSaving || !inputValue.trim()}
              className={`px-6 py-2.5 text-label-md font-bold text-white hover:opacity-90 active:scale-[0.98] rounded-xl transition-all flex items-center gap-2 shadow-lg disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
                mode === "add"
                  ? "bg-secondary text-on-secondary shadow-secondary/20 glow-blue"
                  : "bg-error text-on-error shadow-error/20"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">
                    {mode === "add" ? "done_all" : "delete_sweep"}
                  </span>
                  {mode === "add" ? "Salvar Tudo" : "Remover Tudo"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
