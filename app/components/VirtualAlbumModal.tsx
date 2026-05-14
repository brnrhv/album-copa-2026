"use client";

import React, { useState, useMemo } from "react";
import defaultData from "../../Figurinhas/checklist-copa-2026.json";

interface VirtualAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendName: string;
  friendRawStickers: any[]; // raw user_stickers rows from the database for this specific friend
}

export default function VirtualAlbumModal({ isOpen, onClose, friendName, friendRawStickers }: VirtualAlbumModalProps) {
  const [teamIndex, setTeamIndex] = useState(0);

  const TEAMS = useMemo(() => {
    return Array.from(new Set(defaultData.map(s => s.team)));
  }, []);

  // Map raw DB entries to quick-lookup map
  const friendStickersMap = useMemo(() => {
    const map = new Map<string, any>();
    (friendRawStickers || []).forEach(s => {
      map.set(s.code, s);
    });
    return map;
  }, [friendRawStickers]);

  if (!isOpen) return null;

  // We group 2 teams per double-page spread on desktop, 1 on mobile
  const currentTeamLeft = TEAMS[teamIndex] || "";
  const currentTeamRight = TEAMS[teamIndex + 1] || "";

  const getTeamStickers = (teamName: string) => {
    if (!teamName) return [];
    return defaultData.filter(s => s.team === teamName).map(s => {
      const match = friendStickersMap.get(s.id);
      return {
        ...s,
        quantityOwned: match ? match.quantity : 0,
        pasted: match ? match.pasted : false,
        edition: match ? (match.edition || 'normal') : 'normal',
      };
    });
  };

  const leftStickers = getTeamStickers(currentTeamLeft);
  const rightStickers = getTeamStickers(currentTeamRight);

  const handleNextPage = () => {
    if (teamIndex + 2 < TEAMS.length) {
      setTeamIndex(teamIndex + 2);
    }
  };

  const handlePrevPage = () => {
    if (teamIndex - 2 >= 0) {
      setTeamIndex(teamIndex - 2);
    }
  };

  const renderPage = (teamName: string, stickers: any[]) => {
    if (!teamName) return null;

    const collected = stickers.filter(s => s.quantityOwned > 0).length;
    const total = stickers.length;

    return (
      <div className="flex-1 flex flex-col h-full px-4 sm:px-6 py-6 overflow-y-auto custom-scrollbar bg-[#1F1F1F] relative">
        {/* Watermark bg for the physical album texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 flex justify-between items-end border-b-2 border-secondary pb-2 mb-6">
          <h4 className="font-display-md text-xl sm:text-2xl font-bold text-on-surface tracking-wide uppercase">
            {teamName}
          </h4>
          <div className="text-right font-mono text-xs text-on-surface-variant font-bold">
            {collected}/{total} Figurinhas
          </div>
        </div>

        {/* Responsive Sticker Grid for Physical Book Effect */}
        <div className="relative z-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3">
          {stickers.map((sticker) => {
            const isCollected = sticker.quantityOwned > 0;
            const isRepeated = sticker.quantityOwned > 1;
            
            let stickerBorder = "border-outline-variant/40";
            let stickerBg = "bg-surface-container-lowest/50 border-dashed";
            let labelText = "text-on-surface/20";

            if (isCollected) {
              stickerBg = "bg-surface-container border-solid shadow-md";
              labelText = "text-on-surface font-bold";
              stickerBorder = sticker.pasted ? "border-secondary" : "border-secondary/50";
              
              if (sticker.edition === 'shiny') stickerBorder = "border-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.3)]";
              else if (sticker.edition === 'gold') stickerBorder = "border-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.3)]";
              else if (sticker.edition === 'silver') stickerBorder = "border-[#C0C0C0]";
              else if (sticker.edition === 'bronze') stickerBorder = "border-[#CD7F32]";
            }

            return (
              <div 
                key={sticker.id}
                className={`relative aspect-[3/4] rounded border-2 flex flex-col items-center justify-center transition-all hover:scale-105 group
                  ${stickerBg} ${stickerBorder}
                `}
                title={`${sticker.name || sticker.code} - ${sticker.category}`}
              >
                {/* Sticker Textures */}
                {isCollected && sticker.edition && (
                  <div className={`absolute inset-0 opacity-20 pointer-events-none z-0 rounded ${
                    sticker.edition === 'shiny' ? 'bg-gradient-to-tr from-[#00E5FF] via-[#FF00FF] to-transparent' :
                    sticker.edition === 'gold' ? 'bg-gradient-to-tr from-[#FFD700] via-[#FFA500] to-transparent' : ''
                  }`}></div>
                )}

                <div className="relative z-10 text-center p-1 flex flex-col items-center justify-center w-full h-full">
                  {isCollected ? (
                    <>
                      <span className={`font-mono text-[11px] ${labelText}`}>{sticker.code}</span>
                      {sticker.name ? (
                        <span className="text-[9px] text-on-surface-variant truncate w-full px-1 mt-1 leading-none block text-center font-bold">
                          {sticker.name.split(" ").pop()}
                        </span>
                      ) : (
                        <span className="text-[8px] text-on-surface-variant opacity-50 tracking-tighter block text-center mt-1">{sticker.category}</span>
                      )}
                      {/* Repeated badge on top right */}
                      {isRepeated && (
                        <div className="absolute -top-1.5 -right-1.5 bg-tertiary text-on-tertiary font-mono text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md border border-white/10">
                          +{sticker.quantityOwned - 1}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="font-mono text-xs font-bold text-outline opacity-30 select-none">{sticker.code}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Backdrop overlay */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
      />
      
      {/* Inner Window Container */}
      <div className="relative w-full max-w-6xl h-[85vh] flex flex-col bg-[#121212] rounded-2xl border border-outline-variant/50 shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Premium Top Navbar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1a1a1a] border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-tertiary flex items-center justify-center text-white font-bold shadow-[0_0_10px_rgba(0,82,255,0.3)]">
              {friendName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Álbum Virtual de <span className="text-secondary">{friendName}</span>
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">Folheie a coleção do seu colega</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-white bg-surface-container-high hover:bg-surface-container-highest rounded-full transition-colors"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Book Container with physical-feeling styles */}
        <div className="flex-1 relative flex overflow-hidden bg-[#121212] group/book">
          
          {/* Spine Shadow Overlay down the middle (Only on Desktop/Dual page mode) */}
          <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-10 bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none z-30"></div>
          <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-black/60 pointer-events-none z-30"></div>

          {/* Main Book Pages Container */}
          <div className="flex w-full h-full divide-x divide-black/40">
            {/* Left Page (Always visible) */}
            {renderPage(currentTeamLeft, leftStickers)}

            {/* Right Page (Visible on Desktop) */}
            <div className="hidden md:flex flex-1 h-full">
              {currentTeamRight ? renderPage(currentTeamRight, rightStickers) : (
                <div className="flex-1 bg-[#1F1F1F] flex flex-col items-center justify-center text-center p-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-6xl opacity-20 mb-4">menu_book</span>
                  <h4 className="font-bold opacity-30">FIM DO ÁLBUM</h4>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Arrow Buttons floating inside the book edges */}
          <button 
            onClick={handlePrevPage}
            disabled={teamIndex === 0}
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/70 border border-outline-variant/50 backdrop-blur rounded-full flex items-center justify-center text-white transition-all z-40 shadow-xl
              ${teamIndex === 0 ? 'opacity-20 pointer-events-none' : 'opacity-75 hover:opacity-100 hover:scale-110 active:scale-95 hover:bg-secondary'}
            `}
            aria-label="Previous page"
          >
            <span className="material-symbols-outlined text-3xl">chevron_left</span>
          </button>
          
          <button 
            onClick={handleNextPage}
            disabled={teamIndex + 2 >= TEAMS.length}
            className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/70 border border-outline-variant/50 backdrop-blur rounded-full flex items-center justify-center text-white transition-all z-40 shadow-xl
              ${teamIndex + 2 >= TEAMS.length ? 'opacity-20 pointer-events-none' : 'opacity-75 hover:opacity-100 hover:scale-110 active:scale-95 hover:bg-secondary'}
            `}
            aria-label="Next page"
          >
            <span className="material-symbols-outlined text-3xl">chevron_right</span>
          </button>
        </div>

        {/* Book Footer Info & Quick Page Slider */}
        <div className="px-6 py-3 bg-[#161616] border-t border-outline-variant/20 flex items-center justify-between">
          <div className="text-xs font-mono text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">auto_stories</span>
            Página {teamIndex / 2 + 1} de {Math.ceil(TEAMS.length / 2)}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Indicators of active spreads */}
            {Array.from({ length: Math.min(8, Math.ceil(TEAMS.length / 2)) }).map((_, i) => {
              const spreadIdx = i * 2;
              const isActive = teamIndex === spreadIdx || teamIndex === spreadIdx + 1;
              return (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-300 ${isActive ? 'w-4 bg-secondary' : 'w-1.5 bg-outline-variant'}`}
                />
              );
            })}
            {Math.ceil(TEAMS.length / 2) > 8 && <span className="text-[9px] text-on-surface-variant">...</span>}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handlePrevPage} 
              disabled={teamIndex === 0}
              className="px-3 py-1 bg-surface-container text-xs text-on-surface font-bold rounded hover:bg-surface-container-high disabled:opacity-30 transition-colors"
            >
              Anterior
            </button>
            <button 
              onClick={handleNextPage} 
              disabled={teamIndex + 2 >= TEAMS.length}
              className="px-3 py-1 bg-secondary text-xs text-on-secondary font-bold rounded hover:opacity-90 disabled:opacity-30 transition-colors shadow-md"
            >
              Próxima
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
