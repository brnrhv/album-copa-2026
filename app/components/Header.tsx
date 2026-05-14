"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppContext } from "../context/AppContext";

export default function Header({ onToggleMenu }: { onToggleMenu: () => void }) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { signOut } = useAppContext();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };
  return (
    <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-280px)] z-40 bg-surface/80 dark:bg-surface/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-4 lg:px-container-padding h-16 transition-all duration-300">
      <div className="flex items-center gap-3 lg:gap-8">
        {/* Hamburger Menu Button for Mobile */}
        <button 
          onClick={onToggleMenu}
          className="lg:hidden p-2 -ml-2 text-on-surface hover:bg-surface-container rounded-full transition-colors flex items-center justify-center"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <h1 className="font-headline-md text-base sm:text-headline-md font-bold text-on-surface truncate max-w-[150px] sm:max-w-none">
          <span className="sm:inline hidden">FIFA World Cup 2026™ Album</span>
          <span className="sm:hidden inline">Álbum 2026</span>
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-1 sm:flex-none justify-end">
        <div className="relative flex items-center bg-surface-container-low px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-outline-variant w-full max-w-[120px] sm:max-w-md focus-within:max-w-[160px] sm:focus-within:max-w-md transition-all duration-300">
          <span className="material-symbols-outlined text-on-surface-variant text-xs sm:text-sm flex-shrink-0">search</span>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search..." 
            className="bg-transparent border-none focus:ring-0 text-xs sm:text-sm w-full placeholder-on-primary-container outline-none ml-1.5 sm:ml-2" 
          />
        </div>
        <button 
          onClick={signOut}
          className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-error/10 text-error rounded-full hover:bg-error/20 transition-colors flex-shrink-0"
          title="Sign out"
        >
          <span className="material-symbols-outlined text-xs sm:text-sm">logout</span>
          <span className="font-label-md text-xs sm:text-sm hidden xs:inline sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
