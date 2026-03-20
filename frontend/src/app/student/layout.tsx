"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="student">
      <AppLayout isAdmin={false}>
        {children}
      </AppLayout>
    </ProtectedRoute>
  );
}
