import HeroProgress from "./components/dashboard/HeroProgress";
import QuickStats from "./components/dashboard/QuickStats";
import RecentFinds from "./components/dashboard/RecentFinds";

export default function Home() {
  return (
    <>
      <HeroProgress />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <QuickStats />
        <RecentFinds />
      </div>

      {/* Contextual FAB (Only on Dashboard) */}
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-secondary text-on-secondary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 glow-blue">
        <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
      </button>
    </>
  );
}
