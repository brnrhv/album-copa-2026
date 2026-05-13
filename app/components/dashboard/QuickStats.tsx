"use client";

import { useAppContext } from "../../context/AppContext";

export default function QuickStats() {
  const { expenses, stickers, isHydrated } = useAppContext();

  if (!isHydrated) {
    return <div className="md:col-span-4 h-64 glass-card animate-pulse rounded-xl"></div>;
  }

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amountSpent, 0);
  const pasted = stickers.filter(s => s.pasted && s.quantityOwned > 0).length;

  return (
    <div className="md:col-span-4 flex flex-col gap-gutter">
      <div className="glass-card rounded-xl p-6 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline-md text-headline-md text-on-surface">Total Expenses</h3>
          <span className="material-symbols-outlined text-secondary">account_balance_wallet</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-display-lg text-display-lg text-on-surface">${totalSpent.toFixed(2)}</span>
        </div>
        <p className="font-body-md text-on-primary-container">
          Invested so far in your sticker collection journey.
        </p>
      </div>

      <div className="glass-card rounded-xl p-6 bg-tertiary-container/20 border-tertiary-fixed-dim/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded bg-tertiary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-tertiary">inventory_2</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-tertiary-fixed-variant">PASTED STICKERS</p>
            <h4 className="font-headline-md text-headline-md text-on-surface">{pasted} Stickers</h4>
          </div>
        </div>
        <p className="font-body-md text-on-surface-variant mb-4">
          Stickers permanently placed in your album. Keep pasting!
        </p>
      </div>
    </div>
  );
}
