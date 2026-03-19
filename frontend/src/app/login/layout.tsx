"use client";

import { GuestRoute } from "@/components/ProtectedRoute";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestRoute>{children}</GuestRoute>;
}