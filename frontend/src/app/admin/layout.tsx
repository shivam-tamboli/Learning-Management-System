"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="admin">
      <AppLayout isAdmin={true}>
        {children}
      </AppLayout>
    </ProtectedRoute>
  );
}
