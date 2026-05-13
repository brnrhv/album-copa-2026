"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAppContext } from "../context/AppContext";
import StickerModal from "../components/StickerModal";
import { Sticker } from "../types";

function SearchResults() {
  const { stickers, isHydrated, updateSticker } = useAppContext();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);

  if (!isHydrated) return <div className="animate-pulse h-screen bg-surface"></div>;

  const query = q.toLowerCase();
  const results = stickers.filter(s => {
    return (
      s.code.toLowerCase().includes(query) ||
      s.team.toLowerCase().includes(query) ||
      (s.name && s.name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display-lg text-display-lg text-on-surface mb-2">Search Results</h1>
        <p className="font-body-md text-on-surface-variant">
          Showing {results.length} results for "{q}"
        </p>
      </div>

      {results.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl border border-outline-variant/30">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 opacity-50">search_off</span>
          <h3 className="font-headline-md text-on-surface">No stickers found</h3>
          <p className="text-on-primary-container mt-2">Try searching for a different player name, country, or sticker code.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {results.map(sticker => {
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-screen bg-surface"></div>}>
      <SearchResults />
    </Suspense>
  );
}
