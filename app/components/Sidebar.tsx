"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "../context/AppContext";
import Image from "next/image";

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, user } = useAppContext();

  const navLinks = [
    { href: "/", label: "Dashboard", icon: "dashboard" },
    { href: "/collection", label: "My Collection", icon: "style" },
    { href: "/repeated", label: "Repeated", icon: "swap_horiz" },
    { href: "/missing", label: "Missing", icon: "flag" },
    { href: "/community", label: "Community", icon: "groups" },
    { href: "/expenses", label: "Expenses", icon: "account_balance_wallet" },
  ];

  // Handle fallback avatar if no photo
  const displayName = profile?.full_name || user?.email?.split('@')[0] || "Collector";
  const avatarLetter = displayName.charAt(0).toUpperCase();

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

      <div className="mt-auto pt-4 px-4 border-t border-outline-variant">
        <Link 
          href="/profile" 
          className={`flex items-center gap-3 p-2 rounded-lg transition-all hover:bg-surface-container-high active:scale-95 duration-200
            ${pathname === '/profile' ? 'bg-secondary-container/10 ring-1 ring-secondary/30' : ''}
          `}
        >
          {profile?.avatar_url ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-secondary glow-blue flex-shrink-0">
              <img 
                src={profile.avatar_url} 
                alt={displayName} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-secondary/20 border-2 border-secondary flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-secondary text-lg">{avatarLetter}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="block font-body-md font-semibold text-on-surface truncate leading-tight">
              {displayName}
            </span>
            <span className="block text-[11px] text-on-surface-variant truncate font-medium leading-none mt-0.5">
              My Profile
            </span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
