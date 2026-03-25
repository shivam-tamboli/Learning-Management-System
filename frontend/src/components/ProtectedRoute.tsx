"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "student";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  if (requiredRole === "admin" && !isAdmin) {
    router.push("/student/dashboard");
    return null;
  }

  if (requiredRole === "student" && isAdmin) {
    router.push("/admin/dashboard");
    return null;
  }

  return <>{children}</>;
}

interface GuestRouteProps {
  children: ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    const redirectPath = user?.role === "admin" ? "/admin/dashboard" : "/student/dashboard";
    router.push(redirectPath);
    return null;
  }

  return <>{children}</>;
}