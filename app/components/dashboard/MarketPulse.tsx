import { MARKET_PULSE } from "../../lib/mockData";

export default function MarketPulse() {
  return (
    <div className="md:col-span-12 lg:col-span-4 glass-card rounded-xl p-6 overflow-hidden relative">
      <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Market Pulse</h3>
      <div className="space-y-6">
        {MARKET_PULSE.map((pulse) => (
          <div key={pulse.id} className="flex items-start gap-4">
            <div className={`w-1 h-12 bg-${pulse.color} rounded-full`}></div>
            <div>
              <p className={`font-label-sm text-label-sm text-${pulse.color}`}>{pulse.type}</p>
              <p className="font-body-md text-on-surface">{pulse.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Decorative Graphic */}
      <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none">
        <span className="material-symbols-outlined text-[160px]">language</span>
      </div>
    </div>
  );
}
