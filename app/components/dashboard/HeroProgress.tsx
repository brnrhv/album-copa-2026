"use client";

import { useAppContext } from "../../context/AppContext";

export default function HeroProgress() {
  const { stickers, isHydrated } = useAppContext();

  if (!isHydrated) {
    return <section className="glass-card rounded-xl p-8 mb-8 h-48 animate-pulse"></section>;
  }

  const totalStickers = stickers.length;
  const collectedUnique = stickers.filter(s => s.quantityOwned > 0).length;
  const missing = totalStickers - collectedUnique;
  const rawPercent = totalStickers === 0 ? 0 : (collectedUnique / totalStickers) * 100;
  
  // Format to 1 decimal place if not 0 or 100 to feel progress on every single sticker added
  const displayPercent = rawPercent === 0 ? "0" : rawPercent === 100 ? "100" : rawPercent.toFixed(1);
  const visualPercent = collectedUnique > 0 ? Math.max(rawPercent, 1) : 0; // Minimum 1% width for visible feedback
  const duplicates = stickers.reduce((acc, curr) => acc + (curr.quantityOwned > 1 ? curr.quantityOwned - 1 : 0), 0);

  return (
    <section className="glass-card rounded-xl p-8 mb-8 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-secondary-container/10 to-transparent pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <h2 className="font-display-lg text-display-lg text-on-surface mb-2">{displayPercent}% Complete</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
            You're on the road to the final! Just {missing} stickers left to complete the official album.
          </p>

          <div className="relative w-full h-4 bg-surface-container-lowest rounded-full overflow-hidden mb-2">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-secondary to-tertiary glow-blue transition-all duration-1000" 
              style={{ width: `${visualPercent}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between font-label-sm text-label-sm text-on-primary-container">
            <span>START</span>
            <span>ALBUM MASTER</span>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="text-center px-6 py-4 glass-card rounded-lg min-w-[120px]">
            <span className="block font-headline-md text-headline-md text-secondary">{collectedUnique}</span>
            <span className="font-label-sm text-label-sm text-on-primary-container">COLLECTED</span>
          </div>
          
          <div className="text-center px-6 py-4 glass-card rounded-lg min-w-[120px]">
            <span className="block font-headline-md text-headline-md text-tertiary">{duplicates}</span>
            <span className="font-label-sm text-label-sm text-on-primary-container">DUPLICATES</span>
          </div>
        </div>
      </div>
    </section>
  );
}
