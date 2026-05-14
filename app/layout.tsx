import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { AppContextProvider } from "./context/AppContext";
import LayoutWrapper from "./components/LayoutWrapper";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "FIFA World Cup 2026™ Album Manager",
  description: "Manage your 2026 World Cup stickers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@400;600;700&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
      </head>
      <body className="font-body-md pitch-texture min-h-screen">
        <AppContextProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AppContextProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
