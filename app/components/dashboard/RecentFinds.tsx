"use client";

import Link from "next/link";
import { useAppContext } from "../../context/AppContext";

export default function RecentFinds() {
  const { stickers, isHydrated } = useAppContext();

  if (!isHydrated) {
    return <div className="md:col-span-8 h-64 glass-card animate-pulse rounded-xl"></div>;
  }

  // Get some owned stickers to show as recent finds
  const ownedStickers = stickers.filter(s => s.quantityOwned > 0).slice(0, 3);

  return (
    <div className="md:col-span-8 glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline-md text-headline-md text-on-surface">Recent Finds</h3>
        <Link href="/collection" className="font-label-sm text-label-sm text-secondary hover:underline">View Collection</Link>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ownedStickers.map((sticker) => (
          <div key={sticker.id} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-outline-variant hover:scale-105 transition-transform duration-300 group">
            <div className="w-full h-full bg-surface-container flex items-center justify-center overflow-hidden">
              {sticker.image ? (
                <img src={sticker.image} alt={sticker.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display-lg text-on-surface opacity-30">{sticker.code}</span>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-3 glass-card border-none bg-black/40 backdrop-blur-md">
              <p className="font-label-sm text-label-sm text-white truncate">{sticker.name || "Unknown Player"}</p>
              <p className={`font-label-sm text-[10px] text-tertiary`}>{sticker.category}</p>
            </div>
            <div className="absolute top-2 right-2 bg-secondary text-on-secondary px-2 py-0.5 rounded font-label-sm text-[10px]">
              x{sticker.quantityOwned}
            </div>
          </div>
        ))}

        {/* Add Sticker Card */}
        <Link href="/collection" className="relative aspect-[3/4] rounded-lg overflow-hidden border border-outline-variant hover:scale-105 transition-transform duration-300 group border-dashed border-2 flex flex-col items-center justify-center bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-secondary text-4xl mb-2">add_circle</span>
          <p className="font-label-sm text-label-sm text-on-primary-container text-center px-2">MANAGE COLLECTION</p>
        </Link>
      </div>
    </div>
  );
}
