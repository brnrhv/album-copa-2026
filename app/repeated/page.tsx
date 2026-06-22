"use client";
 
import { useAppContext } from "../context/AppContext";
import { useState } from "react";
import CompareModal from "../components/CompareModal";

export default function RepeatedPage() {
  const { stickers, isHydrated, updateSticker } = useAppContext();
  const [copied, setCopied] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
 
  if (!isHydrated) return <div className="animate-pulse h-screen bg-surface"></div>;
 
  const repeatedStickers = stickers.filter(s => s.quantityOwned > 1);
  const totalRepeated = repeatedStickers.reduce((acc, curr) => acc + (curr.quantityOwned - 1), 0);
 
  // Group by team
  const grouped: Record<string, typeof repeatedStickers> = {};
  repeatedStickers.forEach(s => {
    if (!grouped[s.team]) grouped[s.team] = [];
    grouped[s.team].push(s);
  });
 
  const sortedTeams = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
  sortedTeams.forEach(team => {
    grouped[team].sort((a, b) => a.code.localeCompare(b.code));
  });

  const handleExport = () => {
    let text = "Figurinhas Repetidas Disponíveis para Troca:\n\n";
    sortedTeams.forEach(team => {
      text += `${team}:\n`;
      const codes = grouped[team].map(s => {
        const qty = s.quantityOwned - 1;
        return qty > 1 ? `${s.code} (x${qty})` : s.code;
      });
      text += codes.join(", ") + "\n\n";
    });
 
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
 
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface mb-2">Figurinhas Repetidas</h1>
          <p className="font-body-md text-on-surface-variant">Você tem um total de {totalRepeated} figurinhas repetidas para trocar.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="flex items-center gap-2 bg-secondary text-on-secondary font-bold hover:opacity-90 active:scale-[0.98] px-6 py-3 rounded-xl transition-all shadow-lg shadow-secondary/20 glow-blue cursor-pointer text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">compare_arrows</span>
            COMPARAR
          </button>
          <button 
            onClick={handleExport}
            disabled={repeatedStickers.length === 0}
            className="flex items-center gap-2 bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest text-on-surface font-bold px-6 py-3 rounded-xl text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">{copied ? "check" : "content_copy"}</span>
            {copied ? "COPIADO!" : "COPIAR LISTA"}
          </button>
        </div>
      </div>
 
      {repeatedStickers.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 opacity-50">sentiment_dissatisfied</span>
          <h3 className="font-headline-md text-on-surface">Nenhuma repetida ainda</h3>
          <p className="text-on-primary-container mt-2">Marque figurinhas duplicadas no Álbum Virtual para vê-las aqui.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedTeams.map(team => {
            const list = grouped[team];
            return (
            <div key={team} className="glass-card p-6 rounded-xl border-l-4 border-l-tertiary">
              <h2 className="font-headline-md text-on-surface mb-4 flex items-center justify-between">
                {team}
                <span className="font-label-sm bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-sm">
                  {list.reduce((acc, s) => acc + (s.quantityOwned - 1), 0)} REPETIDAS
                </span>
              </h2>
              <div className="flex flex-wrap gap-3">
                {list.map(s => (
                  <div key={s.id} className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/50 pl-4 pr-2 py-1.5 rounded-full group hover:border-tertiary/40 transition-all duration-200">
                    <span className="font-body-md font-bold text-on-surface">{s.code}</span>
                    <span className="font-label-sm bg-tertiary-container text-on-tertiary-container px-2.5 py-0.5 rounded-full text-xs font-medium">x{s.quantityOwned - 1}</span>
                    <button 
                      onClick={() => updateSticker(s.id, { quantityOwned: s.quantityOwned - 1 })}
                      className="flex items-center justify-center w-7 h-7 rounded-full text-on-surface-variant hover:bg-error/10 hover:text-error md:opacity-50 md:group-hover:opacity-100 transition-all duration-200"
                      title="Remover uma unidade desta repetida"
                      aria-label={`Remover uma repetida ${s.code}`}
                    >
                      <span className="material-symbols-outlined text-lg">do_not_disturb_on</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )})}
        </div>
      )}

      <CompareModal 
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
      />
    </div>
  );
}
