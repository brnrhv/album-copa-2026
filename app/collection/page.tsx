"use client";

import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import StickerModal from "../components/StickerModal";
import BulkAddModal from "../components/BulkAddModal";
import { Sticker } from "../types";

export default function CollectionPage() {
  const { stickers, isHydrated, updateSticker, bulkAddStickers } = useAppContext();
  const [activeTeam, setActiveTeam] = useState<string>("");
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  if (!isHydrated) return <div className="animate-pulse h-screen bg-surface"></div>;

  const TEAMS = Array.from(new Set(stickers.map(s => s.team)));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface mb-2">Minha Coleção</h1>
          <p className="font-body-md text-on-surface-variant">Navegue pelas suas figurinhas, registre repetidas e complete o seu álbum físico.</p>
        </div>
        <button 
          onClick={() => setIsBulkModalOpen(true)}
          className="self-start md:self-auto flex items-center gap-2 px-5 py-3 bg-secondary text-on-secondary font-bold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-secondary/20 glow-blue flex-shrink-0 font-label-md"
        >
          <span className="material-symbols-outlined">playlist_add</span>
          Adicionar em Massa
        </button>
      </div>

      <BulkAddModal 
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSave={bulkAddStickers}
      />

      {activeTeam === "" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {TEAMS.map(team => {
            const teamStickers = stickers.filter(s => s.team === team);
            const collectedInTeam = teamStickers.filter(s => s.quantityOwned > 0).length;
            const totalInTeam = teamStickers.length;
            const progress = totalInTeam === 0 ? 0 : Math.round((collectedInTeam / totalInTeam) * 100);

            return (
              <button 
                key={team}
                onClick={() => setActiveTeam(team)}
                className="glass-card flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors text-left border-outline-variant hover:border-secondary hover:shadow-[0_0_15px_rgba(0,82,255,0.15)] group"
              >
                <div>
                  <h3 className="font-title-md text-on-surface font-bold group-hover:text-secondary transition-colors">{team}</h3>
                  <p className="font-label-sm text-on-surface-variant">
                    {collectedInTeam} / {totalInTeam}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <span className="font-label-sm font-bold text-secondary">{progress}%</span>
                   <div className="w-12 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${progress}%` }}></div>
                   </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => setActiveTeam("")}
            className="self-start flex items-center gap-2 text-on-surface-variant hover:text-secondary transition-colors py-2 font-label-md"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to All Categories
          </button>

          {(() => {
            const team = activeTeam;
            const teamStickers = stickers.filter(s => s.team === team);
            const collectedInTeam = teamStickers.filter(s => s.quantityOwned > 0).length;
            const totalInTeam = teamStickers.length;
            const missingInTeam = totalInTeam - collectedInTeam;
            const repeatedInTeam = teamStickers.reduce((acc, s) => acc + (s.quantityOwned > 1 ? s.quantityOwned - 1 : 0), 0);
            const progress = totalInTeam === 0 ? 0 : Math.round((collectedInTeam / totalInTeam) * 100);

            return (
              <div className="glass-card overflow-hidden border-secondary shadow-[0_0_20px_rgba(0,82,255,0.1)] glow-blue">
                {/* Header */}
                <div className="w-full flex items-center justify-between p-6 text-left border-b border-outline-variant/30 bg-surface-container-low">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-headline-md text-on-surface font-bold">{team}</h3>
                    <p className="font-label-sm text-on-surface-variant">
                      {collectedInTeam} / {totalInTeam} COLLECTED ({progress}%)
                    </p>
                  </div>
                  
                  <div className="hidden sm:block w-32 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                <div className="p-6 bg-surface-container-low/30">
                   {/* STATS ROW */}
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                     <div className="glass-card p-4 text-center sm:text-left border-outline-variant/30">
                       <p className="text-on-surface-variant text-sm mb-1">Collected</p>
                       <p className="text-2xl font-bold text-on-surface">{collectedInTeam}</p>
                     </div>
                     <div className="glass-card p-4 text-center sm:text-left border-outline-variant/30">
                       <p className="text-on-surface-variant text-sm mb-1">Missing</p>
                       <p className="text-2xl font-bold text-error">{missingInTeam}</p>
                     </div>
                     <div className="glass-card p-4 text-center sm:text-left border-outline-variant/30">
                       <p className="text-on-surface-variant text-sm mb-1">Repeated</p>
                       <p className="text-2xl font-bold text-tertiary">{repeatedInTeam}</p>
                     </div>
                     <div className="glass-card p-4 text-center sm:text-left border-outline-variant/30">
                       <p className="text-on-surface-variant text-sm mb-1">Completion</p>
                       <p className="text-2xl font-bold text-secondary">{progress}%</p>
                     </div>
                   </div>

                   {/* Grid */}
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                     {teamStickers.map(sticker => {
                        const isMissing = sticker.quantityOwned === 0;
                        const isRepeated = sticker.quantityOwned > 1;
                        
                        const editionBorder = !isMissing && sticker.edition ? (
                          sticker.edition === 'shiny' ? "border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:shadow-[0_0_25px_rgba(0,229,255,0.7)]" :
                          sticker.edition === 'lilac' ? "border-[#B68EE6] shadow-[0_0_15px_rgba(182,142,230,0.3)] hover:shadow-[0_0_25px_rgba(182,142,230,0.6)]" :
                          sticker.edition === 'bronze' ? "border-[#CD7F32] shadow-[0_0_15px_rgba(205,127,50,0.3)] hover:shadow-[0_0_25px_rgba(205,127,50,0.6)]" :
                          sticker.edition === 'silver' ? "border-[#C0C0C0] shadow-[0_0_15px_rgba(192,192,192,0.3)] hover:shadow-[0_0_25px_rgba(192,192,192,0.6)]" :
                          sticker.edition === 'gold' ? "border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.4)] hover:shadow-[0_0_25px_rgba(255,215,0,0.7)]" : ""
                        ) : "";

                        const defaultBorder = sticker.pasted
                                  ? "border-secondary bg-secondary/10 shadow-[0_0_15px_rgba(0,82,255,0.2)] hover:shadow-[0_0_20px_rgba(0,82,255,0.4)]"
                                  : "border-secondary/50 bg-surface-container hover:border-secondary hover:shadow-[0_0_15px_rgba(0,82,255,0.3)]";

                        return (
                          <div 
                            key={sticker.id}
                            onClick={() => setSelectedSticker(sticker)}
                            className={`relative aspect-[3/4] rounded-lg overflow-hidden border transition-all cursor-pointer group ${
                              isMissing 
                                ? "border-outline-variant/30 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 bg-surface-container-low" 
                                : editionBorder || defaultBorder
                            }`}
                          >
                            {!isMissing && sticker.edition && (
                              <div className={`absolute inset-0 opacity-20 pointer-events-none z-0 ${
                                sticker.edition === 'shiny' ? 'bg-gradient-to-tr from-[#00E5FF] via-[#FF00FF] to-transparent' :
                                sticker.edition === 'lilac' ? 'bg-gradient-to-tr from-[#B68EE6] to-transparent' :
                                sticker.edition === 'bronze' ? 'bg-gradient-to-tr from-[#CD7F32] to-transparent' :
                                sticker.edition === 'silver' ? 'bg-gradient-to-tr from-[#C0C0C0] to-transparent' :
                                sticker.edition === 'gold' ? 'bg-gradient-to-tr from-[#FFD700] via-[#FFA500] to-transparent' : ''
                              }`}></div>
                            )}
                            <div className="w-full h-full bg-surface-container-low flex flex-col items-center justify-center p-4 relative z-10">
                              {sticker.image ? (
                                <img src={sticker.image} alt={sticker.name} className={`w-full h-full object-cover ${isMissing ? 'opacity-20' : ''}`} />
                              ) : (
                                <span className={`font-display-lg ${isMissing ? 'text-on-surface/20' : 'text-on-surface/40'}`}>
                                  {sticker.code}
                                </span>
                              )}
                              {!isMissing && sticker.pasted && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none drop-shadow-xl z-20">
                                  <span className="material-symbols-outlined text-[100px] text-white">verified</span>
                                </div>
                              )}
                            </div>
                            
                            <div className={`absolute bottom-0 left-0 right-0 p-3 glass-card border-none backdrop-blur-md transition-colors z-20 ${
                              isMissing ? "bg-black/60" : "bg-secondary-container/90"
                            }`}>
                              <p className={`font-label-sm text-label-sm truncate ${isMissing ? "text-white" : "text-white font-bold"}`}>
                                {sticker.name || "Unknown Player"}
                              </p>
                              <p className={`font-label-sm text-[10px] ${
                                isMissing ? (sticker.category === 'Badge' ? 'text-tertiary' : 'text-on-primary-container') : "text-secondary-fixed-dim"
                              }`}>
                                {sticker.category}
                              </p>
                            </div>

                            {/* Status Badges */}
                            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-20">
                              {isRepeated && (
                                <span className="bg-tertiary text-on-tertiary px-2 py-0.5 rounded font-label-sm text-[10px] shadow-lg">
                                  x{sticker.quantityOwned - 1} REPEATED
                                </span>
                              )}
                              {!isMissing && sticker.pasted && (
                                <span className="bg-secondary/80 text-on-secondary px-2 py-0.5 rounded font-label-sm text-[10px] flex items-center gap-1 backdrop-blur-sm">
                                  <span className="material-symbols-outlined text-[10px]">done</span> PASTED
                                </span>
                              )}
                              {isMissing && (
                                <span className="bg-error-container text-error px-2 py-0.5 rounded font-label-sm text-[10px]">
                                  MISSING
                                </span>
                              )}
                            </div>
                          </div>
                        );
                     })}
                   </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <StickerModal 
        isOpen={!!selectedSticker} 
        sticker={selectedSticker} 
        onClose={() => setSelectedSticker(null)}
        onSave={updateSticker}
      />
    </div>
  );
}
