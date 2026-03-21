"use client";

import { useAuth } from "@/lib/auth";

function Loader() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}>
      <div style={{
        width: "32px",
        height: "32px",
        border: "3px solid #e5e7eb",
        borderTopColor: "#3b82f6",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );
}

export default function Home() {
  const { validated } = useAuth();

  if (!validated) {
    return <Loader />;
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      gap: "8px",
    }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>LMS Platform</h1>
      <p style={{ color: "#666" }}>Redirecting...</p>
    </div>
  );
}
