"use client";

import { useAuth } from "@/lib/auth";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "student";
}

function Loader() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "transparent",
    }}>
      <div style={{
        width: "32px",
        height: "32px",
        border: "3px solid #e5e7eb",
        borderTopColor: "#3b82f6",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, validated } = useAuth();

  if (!validated || isLoading) {
    return <Loader />;
  }

  if (requiredRole === "admin" && user?.role !== "admin") {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "16px",
      }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Access Denied</h1>
        <p style={{ color: "#666" }}>You do not have permission to access this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}

interface GuestRouteProps {
  children: ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { validated } = useAuth();

  if (!validated) {
    return <Loader />;
  }

  return <>{children}</>;
}
