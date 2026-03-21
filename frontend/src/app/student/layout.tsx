"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

export const dynamic = "force-dynamic";

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
