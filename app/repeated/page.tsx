"use client";

import { useAppContext } from "../context/AppContext";
import { useState } from "react";

export default function RepeatedPage() {
  const { stickers, isHydrated } = useAppContext();
  const [copied, setCopied] = useState(false);

  if (!isHydrated) return <div className="animate-pulse h-screen bg-surface"></div>;

  const repeatedStickers = stickers.filter(s => s.quantityOwned > 1);
  const totalRepeated = repeatedStickers.reduce((acc, curr) => acc + (curr.quantityOwned - 1), 0);

  // Group by team
  const grouped: Record<string, typeof repeatedStickers> = {};
  repeatedStickers.forEach(s => {
    if (!grouped[s.team]) grouped[s.team] = [];
    grouped[s.team].push(s);
  });

  const handleExport = () => {
    let text = "Repeated Stickers Available for Trade:\n\n";
    Object.keys(grouped).forEach(team => {
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
          <h1 className="font-display-lg text-display-lg text-on-surface mb-2">Repeated for Trade</h1>
          <p className="font-body-md text-on-surface-variant">You have a total of {totalRepeated} repeated stickers to trade.</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={repeatedStickers.length === 0}
          className="flex items-center gap-2 bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest text-on-surface px-6 py-3 rounded-lg font-label-sm transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined">{copied ? "check" : "content_copy"}</span>
          {copied ? "COPIED TO CLIPBOARD" : "EXPORT AS TEXT"}
        </button>
      </div>

      {repeatedStickers.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 opacity-50">sentiment_dissatisfied</span>
          <h3 className="font-headline-md text-on-surface">No repeated stickers yet</h3>
          <p className="text-on-primary-container mt-2">Log your collection to see duplicates here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([team, list]) => (
            <div key={team} className="glass-card p-6 rounded-xl border-l-4 border-l-tertiary">
              <h2 className="font-headline-md text-on-surface mb-4 flex items-center justify-between">
                {team}
                <span className="font-label-sm bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-sm">
                  {list.reduce((acc, s) => acc + (s.quantityOwned - 1), 0)} STICKERS
                </span>
              </h2>
              <div className="flex flex-wrap gap-3">
                {list.map(s => (
                  <div key={s.id} className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/50 px-4 py-2 rounded-lg">
                    <span className="font-body-md font-bold text-on-surface">{s.code}</span>
                    <span className="font-label-sm text-tertiary">x{s.quantityOwned - 1}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
