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
    </>
  );
}
