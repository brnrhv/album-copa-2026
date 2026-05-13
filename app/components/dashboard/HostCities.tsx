import { HOST_CITIES } from "../../lib/mockData";

export default function HostCities() {
  return (
    <div className="md:col-span-12 lg:col-span-8 glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Host City Context</h3>
          <p className="font-label-sm text-label-sm text-on-primary-container uppercase">Live Trade Events & Match Buzz</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-[10px] border border-secondary/30">USA</span>
          <span className="px-3 py-1 rounded-full bg-tertiary-container/20 text-tertiary font-label-sm text-[10px] border border-tertiary/30">MEXICO</span>
          <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[10px] border border-outline-variant">CANADA</span>
        </div>
      </div>

      <div className="space-y-4">
        {HOST_CITIES.map((city) => (
          <div key={city.id} className={`flex items-center justify-between p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/30 hover:border-${city.color} transition-colors cursor-pointer group`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container flex items-center justify-center shrink-0">
                <span className={`material-symbols-outlined text-${city.color}`}>location_on</span>
              </div>
              <div>
                <h4 className="font-body-md font-bold text-on-surface">{city.name}</h4>
                <p className="font-label-sm text-label-sm text-on-primary-container">{city.desc}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`block font-label-sm text-label-sm text-${city.color}`}>{city.stats}</span>
              <span className="text-[10px] text-on-surface-variant uppercase">{city.preview}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
