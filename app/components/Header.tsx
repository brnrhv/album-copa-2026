"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppContext } from "../context/AppContext";

export default function Header() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { signOut } = useAppContext();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-280px)] z-40 bg-surface/80 dark:bg-surface/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-container-padding h-16">
      <div className="flex items-center gap-8">
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">FIFA World Cup 2026™ Album</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex items-center bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant w-full max-w-md">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search player, team, code..." 
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder-on-primary-container outline-none ml-2" 
          />
        </div>
        <button 
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error rounded-full hover:bg-error/20 transition-colors ml-4"
          title="Sign out"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span className="font-label-md text-sm">Sair</span>
        </button>
      </div>
    </header>
  );
}
