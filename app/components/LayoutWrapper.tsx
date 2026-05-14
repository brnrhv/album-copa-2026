"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    </>
  );
}
