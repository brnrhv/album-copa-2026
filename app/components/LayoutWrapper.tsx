"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BulkAddModal from "./BulkAddModal";
import { useAppContext } from "../context/AppContext";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const { bulkAddStickers } = useAppContext();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    // Render authentication pages in full-screen without sidebars, headers, or main padding
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header onToggleMenu={() => setIsSidebarOpen(!isSidebarOpen)} />
      <main className="lg:ml-sidebar-width pt-20 lg:pt-24 px-4 lg:px-container-padding pb-container-padding transition-all duration-300">
        {children}
      </main>

      {/* Global Floating Action Button (FAB) for quick adding */}
      <button 
        onClick={() => setIsBulkModalOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-secondary text-on-secondary rounded-full shadow-[0_4px_20px_rgba(0,82,255,0.4)] flex items-center justify-center hover:scale-110 hover:shadow-[0_4px_25px_rgba(0,82,255,0.6)] active:scale-95 transition-all z-30 glow-blue"
        title="Adicionar Figurinhas"
      >
        <span className="material-symbols-outlined text-2xl sm:text-3xl">playlist_add</span>
      </button>

      <BulkAddModal 
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSave={bulkAddStickers}
      />
    </>
  );
}
