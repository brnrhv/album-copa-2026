"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Dashboard", icon: "dashboard" },
    { href: "/collection", label: "My Collection", icon: "style" },
    { href: "/repeated", label: "Repeated", icon: "swap_horiz" },
    { href: "/missing", label: "Missing", icon: "flag" },
    { href: "/expenses", label: "Expenses", icon: "account_balance_wallet" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-sidebar-width bg-surface-container dark:bg-surface-container flex flex-col py-container-padding backdrop-blur-xl bg-opacity-60 border-r border-outline-variant shadow-2xl z-50">
      <div className="px-6 mb-10">
        <span className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">Pro Collector</span>
        <p className="font-label-sm text-label-sm text-on-primary-container mt-1">Sticker Manager</p>
      </div>

      <nav className="flex-1 space-y-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href}
              href={link.href} 
              className={`flex items-center gap-4 font-medium pl-4 py-2 transition-all duration-200 active:scale-95 transform
                ${isActive 
                  ? "text-secondary font-bold border-l-4 border-secondary bg-secondary-container/10" 
                  : "text-on-surface-variant pl-5 hover:text-on-surface hover:bg-surface-container-high"
                }`}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              <span className="font-body-md text-body-md">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-outline-variant space-y-2">
        <Link href="/settings" className="flex items-center gap-4 text-on-surface-variant font-medium pl-5 hover:text-on-surface transition-all duration-200">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-sm text-label-sm">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
