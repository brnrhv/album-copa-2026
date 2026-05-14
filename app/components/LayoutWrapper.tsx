"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    // Render authentication pages in full-screen without sidebars, headers, or main padding
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <Header />
      <main className="ml-sidebar-width pt-24 px-container-padding pb-container-padding">
        {children}
      </main>
    </>
  );
}
