"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/admin/student", icon: Users },
  { label: "Add Student", href: "/admin/add-student", icon: GraduationCap },
  { label: "Courses", href: "/admin/course/manage", icon: BookOpen },
];

const studentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "My Courses", href: "/student/courses", icon: BookOpen },
  { label: "Profile", href: "/student/profile", icon: Users },
];

interface SidebarContentProps {
  isAdmin: boolean;
  onNavClick?: () => void;
}

function SidebarContent({ isAdmin, onNavClick }: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = isAdmin ? adminNavItems : studentNavItems;
  const { resolvedTheme, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/admin/dashboard" || href === "/student/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5 border-b border-border">
        <Link
          href={isAdmin ? "/admin/dashboard" : "/student/dashboard"}
          className="text-lg font-semibold tracking-tight text-primary"
        >
          LMS Admin
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="size-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="size-5 shrink-0" />
          ) : (
            <Moon className="size-5 shrink-0" />
          )}
          <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="size-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

interface AppSidebarProps {
  isAdmin?: boolean;
}

export function AppSidebar({ isAdmin = false }: AppSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <SidebarContent isAdmin={isAdmin} />
        </div>
      </aside>

      <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Menu className="size-5" />
        </button>
        <Link
          href={isAdmin ? "/admin/dashboard" : "/student/dashboard"}
          className="text-base font-semibold tracking-tight"
        >
          LMS Admin
        </Link>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-card">
            <div className="flex justify-end p-4">
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarContent
              isAdmin={isAdmin}
              onNavClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
