"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push(isAdmin ? "/admin/dashboard" : "/student/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <p>Loading...</p>
    </div>
  );
}