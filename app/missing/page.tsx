"use client";
 
import { useAppContext } from "../context/AppContext";
import { useState } from "react";
import WantedStickersModal from "../components/WantedStickersModal";
 
export default function MissingPage() {
  const { stickers, isHydrated } = useAppContext();
  const [copied, setCopied] = useState(false);
  const [isWantedModalOpen, setIsWantedModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'album' | 'alphabetical'>('album');
 
  if (!isHydrated) return <div className="animate-pulse h-screen bg-surface"></div>;
 
  const missingStickers = stickers.filter(s => s.quantityOwned === 0);
  const totalMissing = missingStickers.length;
 
  // Group by team
  const grouped: Record<string, typeof missingStickers> = {};
  missingStickers.forEach(s => {
    if (!grouped[s.team]) grouped[s.team] = [];
    grouped[s.team].push(s);
  });
 
  let displayTeams: string[] = [];
  missingStickers.forEach(s => {
    if (!displayTeams.includes(s.team)) {
      displayTeams.push(s.team);
    }
  });

  if (sortOrder === 'alphabetical') {
    displayTeams.sort((a, b) => a.localeCompare(b));
    displayTeams.forEach(team => {
      grouped[team].sort((a, b) => a.code.localeCompare(b.code));
    });
  }

  const handleExport = () => {
    let text = "Figurinhas que me Faltam:\n\n";
    displayTeams.forEach(team => {
      text += `${team}:\n`;
      const codes = grouped[team].map(s => s.code);
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
          <h1 className="font-display-lg text-display-lg text-on-surface mb-2">Faltando no Álbum</h1>
          <p className="font-body-md text-on-surface-variant">Faltam {totalMissing} figurinhas para você completar o álbum!</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsWantedModalOpen(true)}
            className="flex items-center gap-2 bg-secondary text-on-secondary font-bold hover:opacity-90 active:scale-[0.98] px-6 py-3 rounded-xl transition-all shadow-lg shadow-secondary/20 glow-blue cursor-pointer text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">checklist</span>
            VERIFICAR LISTA
          </button>
          <button 
            onClick={handleExport}
            disabled={missingStickers.length === 0}
            className="flex items-center gap-2 bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest text-on-surface font-bold px-6 py-3 rounded-xl text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">{copied ? "check" : "content_copy"}</span>
            {copied ? "COPIADO!" : "COPIAR LISTA"}
          </button>
        </div>
      </div>
 
      {missingStickers.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <span className="material-symbols-outlined text-6xl text-secondary mb-4">emoji_events</span>
          <h3 className="font-headline-md text-on-surface">Álbum Completado! 🎉</h3>
          <p className="text-on-primary-container mt-2">Parabéns! Você conseguiu reunir todas as figurinhas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant text-sm font-medium">Ordenar por:</span>
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value as 'album' | 'alphabetical')}
              className="bg-surface-container border border-outline-variant text-on-surface text-sm rounded-lg focus:ring-secondary focus:border-secondary block p-2 outline-none cursor-pointer"
            >
              <option value="album">Ordem do Álbum</option>
              <option value="alphabetical">Ordem Alfabética</option>
            </select>
          </div>

          <div className="space-y-8">
            {displayTeams.map(team => {
              const list = grouped[team];
              return (
              <div key={team} className="glass-card p-6 rounded-xl border-l-4 border-l-error">
                <h2 className="font-headline-md text-on-surface mb-4 flex items-center justify-between">
                  {team}
                  <span className="font-label-sm bg-error-container text-error px-3 py-1 rounded-full text-sm">
                    {list.length} FALTANDO
                  </span>
                </h2>
                <div className="flex flex-wrap gap-3">
                  {list.map(s => (
                    <div key={s.id} className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/50 px-4 py-2 rounded-lg opacity-70 hover:opacity-100 transition-opacity">
                      <span className="font-body-md font-bold text-on-surface-variant">{s.code}</span>
                    </div>
                  ))}
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

      <WantedStickersModal 
        isOpen={isWantedModalOpen}
        onClose={() => setIsWantedModalOpen(false)}
      />
    </div>
  );
}
