"use client";

import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export function AppLayout({ children, isAdmin = false }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isAdmin={isAdmin} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
